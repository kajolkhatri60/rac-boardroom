"""
Models package — import all SQLModel table classes here so that
create_db_and_tables() in db.py sees every table at startup.
"""

from app.models.session import (  # noqa: F401
    InterviewSession,
    Participant,
    Question,
    Answer,
    SessionMode,
    SessionPhase,
    SeatRole,
    QuestionTag,
    QuestionStatus,
    generate_room_code,
)
from app.models.portal import (  # noqa: F401
    User,
    Post,
    PostRequirement,
    AuditEvent,
    UserRole,
    Discipline,
    Grade,
    InterviewType,
    PostStatus,
    RequirementKind,
    DEFAULT_GRADE_WEIGHTS,
)
from app.models.proctor import (  # noqa: F401
    ProctorEvent,
    ProctorEventType,
    ALLOWED_PROCTOR_EVENT_TYPES,
)
