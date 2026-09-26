"""
SQLModel table definitions for the interview session domain.

Table: interview_session  (class name: InterviewSession)
Table: participant
Table: question
Table: answer
"""

import random
import string
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SessionMode(str, Enum):
    live = "live"
    practice = "practice"
    training = "training"


class SessionPhase(str, Enum):
    lobby = "lobby"
    icebreaker = "icebreaker"
    technical = "technical"
    managerial = "managerial"
    closing = "closing"
    ended = "ended"
    processing = "processing"
    review = "review"
    finalised = "finalised"


class SeatRole(str, Enum):
    chairman = "chairman"
    expert = "expert"
    candidate = "candidate"


class QuestionTag(str, Enum):
    technical = "technical"
    managerial = "managerial"


class QuestionStatus(str, Enum):
    queued = "queued"
    live = "live"
    answered = "answered"
    passed = "passed"


# ---------------------------------------------------------------------------
# Room code generation
# ---------------------------------------------------------------------------

# Exclude confusing characters: 0, O, 1, I
_ROOM_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
_ROOM_CODE_LENGTH = 6


def generate_room_code() -> str:
    """Return a random 6-character room code from the unambiguous character set."""
    return "".join(random.choices(_ROOM_CODE_CHARS, k=_ROOM_CODE_LENGTH))


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------

class InterviewSession(SQLModel, table=True):
    __tablename__ = "interview_session"

    id: Optional[int] = Field(default=None, primary_key=True)
    room_code: str = Field(
        max_length=6,
        sa_column_kwargs={"unique": True},
        index=True,
    )
    mode: SessionMode = Field(default=SessionMode.live)
    phase: SessionPhase = Field(default=SessionPhase.lobby)

    # Nullable until foreign-key tables are added in a later stage
    application_id: Optional[int] = Field(default=None)

    scheduled_at: Optional[datetime] = Field(default=None)
    started_at: Optional[datetime] = Field(default=None)
    ended_at: Optional[datetime] = Field(default=None)

    published_to_candidate: bool = Field(default=False)
    model_name: Optional[str] = Field(default=None)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Participant(SQLModel, table=True):
    __tablename__ = "participant"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="interview_session.id")

    # Nullable until User table is added in Stage 3
    user_id: Optional[int] = Field(default=None)

    seat_role: SeatRole
    is_ai: bool = Field(default=False)
    display_name: str
    specialisation: Optional[str] = Field(default=None)

    # Real JSON column (dict or None)
    persona: Optional[Any] = Field(
        default=None,
        sa_column=Column(JSON),
    )

    joined_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Set when the candidate sends lobby_ready; None means not yet ready.
    ready_at: Optional[datetime] = Field(default=None)


class Question(SQLModel, table=True):
    __tablename__ = "question"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="interview_session.id")
    asked_by: int = Field(foreign_key="participant.id")

    seq: int
    text: str
    phase: SessionPhase
    tag: QuestionTag

    follow_up_of: Optional[int] = Field(
        default=None, foreign_key="question.id"
    )

    clarification_request: Optional[str] = Field(default=None)
    clarification_text: Optional[str] = Field(default=None)

    status: QuestionStatus = Field(default=QuestionStatus.queued)
    asked_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    # Set when this question becomes live (status transitions to "live").
    # Used to calculate answer duration_s.
    live_at: Optional[datetime] = Field(default=None)


class Answer(SQLModel, table=True):
    __tablename__ = "answer"

    id: Optional[int] = Field(default=None, primary_key=True)

    # One-to-one with Question (unique FK)
    question_id: int = Field(
        foreign_key="question.id",
        sa_column_kwargs={"unique": True},
    )

    text: str
    passed: bool = Field(default=False)

    submitted_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    duration_s: Optional[float] = Field(default=None)
