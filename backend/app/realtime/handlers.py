"""
WebSocket event handlers.

Each handler opens its own short-lived DB session via session_ctx()
(Rule D from docs/06_RULES.md: server is source of truth; no stale data).

Message routing:
  ping            → pong  (sender only)
  lobby_ready     → sets ready_at in DB; candidate_ready to board; error if non-candidate
  admit_candidate → handle_admit_candidate (chairman only; lobby → icebreaker)
  set_phase       → handle_set_phase (chairman only)
  ask_question    → handle_ask_question (board only)
  submit_answer   → handle_submit_answer (candidate only)
  pass_question   → handle_pass_question (candidate only)
  <unknown>       → error (sender only); connection stays open
"""

import logging
from datetime import datetime, timezone

import app.db
from app.models.session import Participant, SeatRole
from app.realtime.events import (
    handle_admit_candidate,
    handle_ask_question,
    handle_pass_question,
    handle_set_phase,
    handle_submit_answer,
)
from app.realtime.manager import RoomManager
from app.realtime.snapshot import build_snapshot
from app.schemas.ws import WsMessage, make_error_message, make_ws_message

logger = logging.getLogger(__name__)

_BOARD_ROLES = {SeatRole.chairman, SeatRole.expert}


async def on_connect(
    room_code: str,
    participant: Participant,
    manager: RoomManager,
    is_new: bool,
) -> None:
    """
    Called immediately after the WebSocket is registered in the manager.
    - Sends a fresh snapshot to the connecting participant.
    - Broadcasts participant_joined to all others ONLY for truly new
      participants (not page-refresh reconnects).
    """
    online_ids = manager.online_ids(room_code)

    with app.db.session_ctx() as db:
        snapshot = build_snapshot(db, room_code, participant, online_ids)

    await manager.send_to(
        participant.id,
        make_ws_message("snapshot", snapshot),
        room_code=room_code,
    )

    if is_new:
        await manager.broadcast(
            room_code,
            make_ws_message(
                "participant_joined",
                {
                    "participant_id": participant.id,
                    "display_name": participant.display_name,
                    "seat_role": participant.seat_role,
                },
            ),
            exclude=participant.id,
        )


async def on_disconnect(
    room_code: str,
    participant: Participant,
    websocket,
    manager: RoomManager,
) -> None:
    """
    Called when a WebSocketDisconnect is caught.
    Broadcasts participant_left ONLY if the entry was actually removed
    (i.e. the stored websocket matches the closing one — reconnect safety).
    """
    removed = manager.disconnect(room_code, participant.id, websocket)
    if removed:
        await manager.broadcast(
            room_code,
            make_ws_message("participant_left", {"participant_id": participant.id}),
        )


async def handle_message(
    raw: str,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    """
    Parse and dispatch a raw WebSocket text message.
    Invalid JSON or missing required fields → error envelope to sender only.
    Unknown type → error envelope to sender only.
    Connection is never closed here.
    """
    try:
        msg = WsMessage.model_validate_json(raw)
    except Exception:
        await manager.send_to(
            participant.id,
            make_error_message('Invalid message format. Expected {"type": ..., "payload": ...}.'),
            room_code=room_code,
        )
        return

    # ------------------------------------------------------------------ ping
    if msg.type == "ping":
        await manager.send_to(
            participant.id,
            make_ws_message("pong"),
            room_code=room_code,
        )

    # ----------------------------------------------------------- lobby_ready
    elif msg.type == "lobby_ready":
        if participant.seat_role != SeatRole.candidate:
            await manager.send_to(
                participant.id,
                make_error_message("lobby_ready can only be sent by the candidate."),
                room_code=room_code,
            )
            return

        now = datetime.now(timezone.utc)
        with app.db.session_ctx() as db:
            p = db.get(Participant, participant.id)
            if p:
                p.ready_at = now
                db.add(p)
                db.commit()
                participant.ready_at = now

        await manager.send_to_roles(
            room_code,
            _BOARD_ROLES,
            make_ws_message("candidate_ready"),
        )

    # ------------------------------------------------------ admit_candidate
    elif msg.type == "admit_candidate":
        await handle_admit_candidate(msg.payload, participant, room_code, manager)

    # ------------------------------------------------------------ set_phase
    elif msg.type == "set_phase":
        await handle_set_phase(msg.payload, participant, room_code, manager)

    # --------------------------------------------------------- ask_question
    elif msg.type == "ask_question":
        await handle_ask_question(msg.payload, participant, room_code, manager)

    # -------------------------------------------------------- submit_answer
    elif msg.type == "submit_answer":
        await handle_submit_answer(msg.payload, participant, room_code, manager)

    # -------------------------------------------------------- pass_question
    elif msg.type == "pass_question":
        await handle_pass_question(msg.payload, participant, room_code, manager)

    # --------------------------------------------------------- unknown type
    else:
        await manager.send_to(
            participant.id,
            make_error_message(f"Unknown message type: '{msg.type}'."),
            room_code=room_code,
        )
