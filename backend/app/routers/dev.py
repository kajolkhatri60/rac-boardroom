"""
Dev-only endpoints for test inspection and debugging.
Enabled only when DEMO_MODE=true.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.models.proctor import ProctorEvent
from app.models.session import InterviewSession

router = APIRouter(prefix="/dev", tags=["dev"])


@router.get("/sessions/{room_code}/proctor-events")
def get_proctor_events(
    room_code: str,
    db: Session = Depends(get_session),
):
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dev endpoints are only available when DEMO_MODE is true.",
        )

    session = db.exec(
        select(InterviewSession).where(InterviewSession.room_code == room_code.upper())
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with room code '{room_code}' not found.",
        )

    events = db.exec(
        select(ProctorEvent)
        .where(ProctorEvent.session_id == session.id)
        .order_by(ProctorEvent.id.asc())
    ).all()

    return [
        {
            "id": e.id,
            "session_id": e.session_id,
            "participant_id": e.participant_id,
            "type": e.type,
            "started_at": e.started_at.isoformat(),
            "duration_s": e.duration_s,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]
