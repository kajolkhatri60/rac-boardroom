"""
SQLModel table definition for ProctorEvent.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


class ProctorEventType(str, Enum):
    face_missing = "face_missing"
    multiple_faces = "multiple_faces"
    tab_hidden = "tab_hidden"
    window_blur = "window_blur"


ALLOWED_PROCTOR_EVENT_TYPES = {
    ProctorEventType.face_missing.value,
    ProctorEventType.multiple_faces.value,
    ProctorEventType.tab_hidden.value,
    ProctorEventType.window_blur.value,
}


class ProctorEvent(SQLModel, table=True):
    __tablename__ = "proctor_event"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="interview_session.id", index=True)
    participant_id: int = Field(foreign_key="participant.id", index=True)
    type: str = Field(index=True)
    started_at: datetime = Field(...)
    duration_s: float = Field(...)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
