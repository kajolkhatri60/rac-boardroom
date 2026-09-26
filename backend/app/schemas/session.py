"""
Request and response schemas for the interview session endpoints.
These are separate from the SQLModel table classes in app/models/session.py.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.session import SeatRole, SessionMode, SessionPhase


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    mode: SessionMode = SessionMode.live


class InterviewSessionResponse(BaseModel):
    id: int
    room_code: str
    mode: SessionMode
    phase: SessionPhase

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Participant schemas
# ---------------------------------------------------------------------------

class JoinRequest(BaseModel):
    display_name: str
    seat_role: SeatRole
    specialisation: Optional[str] = None


class ParticipantResponse(BaseModel):
    id: int
    session_id: int
    seat_role: SeatRole
    is_ai: bool
    display_name: str
    specialisation: Optional[str]
    joined_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Session detail (session + participants)
# ---------------------------------------------------------------------------

class InterviewSessionDetailResponse(BaseModel):
    id: int
    room_code: str
    mode: SessionMode
    phase: SessionPhase
    application_id: Optional[int]
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    published_to_candidate: bool
    model_name: Optional[str]
    created_at: datetime
    participants: list[ParticipantResponse]

    model_config = {"from_attributes": True}
