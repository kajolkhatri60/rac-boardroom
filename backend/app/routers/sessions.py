"""
Router for interview session management.

Endpoints:
  POST /api/sessions              — create a new session with a generated room code
  POST /api/sessions/{room_code}/join — join a session as a participant
  GET  /api/sessions/{room_code}  — get session info and participant list

TEMPORARY: no auth yet. seat_role comes from the client. Replaced by JWT roles in Stage 3.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.db import get_session
from app.models.session import (
    InterviewSession,
    Participant,
    SeatRole,
    SessionPhase,
    generate_room_code,
)
from app.schemas.session import (
    InterviewSessionDetailResponse,
    InterviewSessionResponse,
    JoinRequest,
    ParticipantResponse,
    SessionCreate,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])

# Seat limits
_MAX_CHAIRMEN = 1
_MAX_CANDIDATES = 1
_MAX_EXPERTS = 4
_ROOM_CODE_MAX_RETRIES = 10


def _get_session_by_code(room_code: str, db: Session) -> InterviewSession:
    """Return the InterviewSession for room_code or raise 404."""
    session = db.exec(
        select(InterviewSession).where(
            InterviewSession.room_code == room_code.upper()
        )
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No interview session found with room code '{room_code.upper()}'.",
        )
    return session


# ---------------------------------------------------------------------------
# POST /api/sessions — create a new session
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=InterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    body: SessionCreate = SessionCreate(),
    db: Session = Depends(get_session),
):
    """Create a new interview session and return its details."""
    # Retry loop: generate a unique room code (up to _ROOM_CODE_MAX_RETRIES tries)
    for attempt in range(1, _ROOM_CODE_MAX_RETRIES + 1):
        code = generate_room_code()
        existing = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == code)
        ).first()
        if not existing:
            break
        if attempt == _ROOM_CODE_MAX_RETRIES:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not generate a unique room code. Please try again.",
            )

    interview_session = InterviewSession(mode=body.mode, room_code=code)
    db.add(interview_session)
    db.commit()
    db.refresh(interview_session)
    return interview_session


# ---------------------------------------------------------------------------
# POST /api/sessions/{room_code}/join — join a session
# ---------------------------------------------------------------------------

@router.post(
    "/{room_code}/join",
    response_model=ParticipantResponse,
    status_code=status.HTTP_201_CREATED,
)
def join_session(
    room_code: str,
    body: JoinRequest,
    db: Session = Depends(get_session),
):
    """
    Join an interview session as a participant.

    TEMPORARY: no auth yet. seat_role comes from the client. Replaced by JWT roles in Stage 3.
    """
    interview_session = _get_session_by_code(room_code, db)

    # Phase gate: joining is only allowed while in lobby
    if interview_session.phase != SessionPhase.lobby:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot join session '{room_code.upper()}': "
                f"session is in phase '{interview_session.phase}', not 'lobby'."
            ),
        )

    # Count current seats in this session
    participants = db.exec(
        select(Participant).where(Participant.session_id == interview_session.id)
    ).all()

    chairmen = sum(1 for p in participants if p.seat_role == SeatRole.chairman)
    candidates = sum(1 for p in participants if p.seat_role == SeatRole.candidate)
    experts = sum(1 for p in participants if p.seat_role == SeatRole.expert)

    # Validate seat limits
    if body.seat_role == SeatRole.chairman and chairmen >= _MAX_CHAIRMEN:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This session already has a chairman. Only one chairman is allowed.",
        )
    if body.seat_role == SeatRole.candidate and candidates >= _MAX_CANDIDATES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This session already has a candidate. Only one candidate is allowed.",
        )
    if body.seat_role == SeatRole.expert and experts >= _MAX_EXPERTS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This session already has the maximum of {_MAX_EXPERTS} experts.",
        )

    participant = Participant(
        session_id=interview_session.id,
        seat_role=body.seat_role,
        display_name=body.display_name,
        specialisation=body.specialisation,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


# ---------------------------------------------------------------------------
# GET /api/sessions/{room_code} — session detail with participants
# ---------------------------------------------------------------------------

@router.get(
    "/{room_code}",
    response_model=InterviewSessionDetailResponse,
)
def get_session_detail(
    room_code: str,
    db: Session = Depends(get_session),
):
    """Return the session and the current list of participants."""
    interview_session = _get_session_by_code(room_code, db)

    participants = db.exec(
        select(Participant).where(Participant.session_id == interview_session.id)
    ).all()

    return InterviewSessionDetailResponse(
        id=interview_session.id,
        room_code=interview_session.room_code,
        mode=interview_session.mode,
        phase=interview_session.phase,
        application_id=interview_session.application_id,
        scheduled_at=interview_session.scheduled_at,
        started_at=interview_session.started_at,
        ended_at=interview_session.ended_at,
        published_to_candidate=interview_session.published_to_candidate,
        model_name=interview_session.model_name,
        created_at=interview_session.created_at,
        participants=[ParticipantResponse.model_validate(p) for p in participants],
    )
