"""
WebSocket endpoint for interview rooms.

URL: /ws/sessions/{room_code}?participant_id=<id>

TEMPORARY: participant_id in the query string. Replaced by JWT token in Stage 3.

Close codes used on rejection (outside the 1000-1015 standard range):
  4404 — room not found
  4403 — participant does not belong to this room
"""

import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import make_transient
from sqlmodel import select

import app.db
from app.models.session import InterviewSession, Participant
from app.realtime import manager as room_manager
from app.realtime.handlers import handle_message, on_connect, on_disconnect

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/sessions/{room_code}")
async def ws_session_endpoint(
    websocket: WebSocket,
    room_code: str,
    # TEMPORARY: participant_id in the query string. Replaced by JWT token in Stage 3.
    participant_id: int = Query(...),
) -> None:
    """
    WebSocket gateway for a single interview room.

    1. Validate room + participant with a short-lived DB session; reject with
       4404 / 4403 if invalid.
    2. Accept the connection, register with RoomManager (closes any old
       connection for the same participant transparently).
    3. Send a role-filtered snapshot; broadcast participant_joined (new only).
    4. Loop: receive text → handle_message (each opens its own DB session).
    5. On disconnect: broadcast participant_left only if truly removed.
    """
    code = room_code.upper()

    # ----------------------------------------------------------------
    # Step 1: validate with a short-lived session; detach objects after.
    # ----------------------------------------------------------------
    with app.db.session_ctx() as db:
        interview_session = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == code)
        ).first()

        if interview_session is None:
            await websocket.close(code=4404)
            return

        participant = db.exec(
            select(Participant).where(
                Participant.id == participant_id,
                Participant.session_id == interview_session.id,
            )
        ).first()

        if participant is None:
            await websocket.close(code=4403)
            return

        # Detach both objects from the session so they remain accessible
        # after the session context manager closes.
        db.expunge(participant)
        make_transient(participant)

    # ----------------------------------------------------------------
    # Step 2: accept and register connection.
    # ----------------------------------------------------------------
    await websocket.accept()

    old_ws = room_manager.connect(code, participant.id, websocket, participant.seat_role)

    # Close the previous connection for this participant (page-refresh safety).
    is_new = old_ws is None
    if old_ws is not None:
        try:
            await old_ws.close(code=4000)
        except Exception:
            pass  # already closed — not an error

    # ----------------------------------------------------------------
    # Step 3: send snapshot; broadcast participant_joined if new.
    # ----------------------------------------------------------------
    await on_connect(code, participant, room_manager, is_new=is_new)

    # ----------------------------------------------------------------
    # Step 4: message loop — each message opens its own DB session.
    # ----------------------------------------------------------------
    try:
        while True:
            raw = await websocket.receive_text()
            await handle_message(raw, participant, code, room_manager)

    except WebSocketDisconnect:
        # ----------------------------------------------------------------
        # Step 5: cleanup — broadcast participant_left only if truly removed.
        # ----------------------------------------------------------------
        await on_disconnect(code, participant, websocket, room_manager)
