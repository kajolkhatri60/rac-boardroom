"""
SQLModel definitions for Users, Posts, PostRequirements, and AuditEvents.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional
from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    admin = "admin"
    board = "board"
    applicant = "applicant"


class Discipline(str, Enum):
    electronics = "Electronics & Communication"
    electrical = "Electrical"
    mechanical = "Mechanical"
    aeronautical = "Aeronautical"
    computer_science = "Computer Science"
    chemical = "Chemical"
    civil = "Civil"
    metallurgy = "Metallurgy & Materials"
    physics = "Physics"
    chemistry = "Chemistry"
    mathematics = "Mathematics"
    life_sciences = "Life Sciences"
    psychology = "Psychology"


class Grade(str, Enum):
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class InterviewType(str, Enum):
    recruitment = "recruitment"
    promotion = "promotion"


class PostStatus(str, Enum):
    draft = "draft"
    published = "published"
    closed = "closed"


class RequirementKind(str, Enum):
    essential = "essential"
    desirable = "desirable"


DEFAULT_GRADE_WEIGHTS = {
    Grade.B: {"knowledge": 70, "managerial": 0, "communication": 30},
    Grade.C: {"knowledge": 60, "managerial": 20, "communication": 20},
    Grade.D: {"knowledge": 60, "managerial": 20, "communication": 20},
    Grade.E: {"knowledge": 50, "managerial": 30, "communication": 20},
    Grade.F: {"knowledge": 45, "managerial": 35, "communication": 20},
    Grade.G: {"knowledge": 45, "managerial": 35, "communication": 20},
}


class User(SQLModel, table=True):
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column_kwargs={"unique": True}, index=True)
    password_hash: str
    full_name: str
    role: UserRole = Field(default=UserRole.applicant)
    discipline: Optional[str] = Field(default=None)
    specialisation: Optional[str] = Field(default=None)
    employee_id: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Post(SQLModel, table=True):
    __tablename__ = "post"

    id: Optional[int] = Field(default=None, primary_key=True)
    advt_no: str = Field(index=True)
    title: str
    discipline: str
    grade: Grade
    interview_type: InterviewType = Field(default=InterviewType.recruitment)
    vacancies: int = Field(default=1)
    closing_date: datetime
    summary: str
    status: PostStatus = Field(default=PostStatus.draft)

    weights: Optional[Any] = Field(
        default=None,
        sa_column=Column(JSON),
    )

    created_by_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    published_at: Optional[datetime] = Field(default=None)


class PostRequirement(SQLModel, table=True):
    __tablename__ = "post_requirement"

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    code: str
    text: str
    kind: RequirementKind = Field(default=RequirementKind.essential)
    position: int = Field(default=1)


class AuditEvent(SQLModel, table=True):
    __tablename__ = "audit_event"

    id: Optional[int] = Field(default=None, primary_key=True)
    actor_id: Optional[int] = Field(default=None, foreign_key="user.id")
    action: str
    entity: str
    entity_id: Optional[str] = Field(default=None)

    detail: Optional[Any] = Field(
        default=None,
        sa_column=Column(JSON),
    )

    at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
