"""
Builds a role-filtered room snapshot for a connecting participant.

Board (chairman, expert) → sees all questions regardless of status.
Candidate → sees ONLY questions with status live / answered / passed.
             NEVER queued questions.

IMPORTANT — Rule 1 (docs/06_RULES.md §A.1):
    No score field may ever be included in any snapshot payload.
    There are no score tables yet, but this filter is explicit and permanent.
    If score fields are added to Question or Answer in future, they MUST be
    excluded here before returning the dict.
"""

from sqlmodel import Session, select

import app.db
from app.models.session import (
    Answer,
    InterviewSession,
    Participant,
    Question,
    QuestionStatus,
    SeatRole,
)

_BOARD_ROLES = {SeatRole.chairman, SeatRole.expert}

# Question statuses visible to the candidate (Rule 1 / docs/08 role filter)
_CANDIDATE_VISIBLE_STATUSES = {
    QuestionStatus.live,
    QuestionStatus.answered,
    QuestionStatus.passed,
}


def _participant_dict(p: Participant, online_ids: set[int]) -> dict:
    return {
        "id": p.id,
        "display_name": p.display_name,
        "seat_role": p.seat_role,
        "specialisation": p.specialisation,
        "is_ai": p.is_ai,
        "online": p.id in online_ids,
        "ready": p.ready_at is not None,
        # No score fields — Rule 1.
    }


def _answer_dict(a: Answer) -> dict:
    return {
        "id": a.id,
        "question_id": a.question_id,
        "text": a.text,
        "passed": a.passed,
        "submitted_at": a.submitted_at.isoformat(),
        "duration_s": a.duration_s,
        # No score fields — Rule 1.
    }


def _question_dict(q: Question, answer: Answer | None) -> dict:
    return {
        "id": q.id,
        "seq": q.seq,
        "text": q.text,
        "phase": q.phase,
        "tag": q.tag,
        "status": q.status,
        "asked_by": q.asked_by,
        "follow_up_of": q.follow_up_of,
        "clarification_request": q.clarification_request,
        "clarification_text": q.clarification_text,
        "asked_at": q.asked_at.isoformat(),
        "live_at": q.live_at.isoformat() if q.live_at else None,
        "answer": _answer_dict(answer) if answer else None,
        # No score fields — Rule 1.
    }


def build_snapshot(
    db: Session,
    room_code: str,
    participant: Participant,
    online_ids: set[int],
) -> dict:
    """
    Build and return a role-filtered snapshot dictionary.

    Parameters
    ----------
    db          : An open SQLModel Session (short-lived; closed by the caller).
    room_code   : Uppercase room code used as the room identifier.
    participant : The connecting participant (detached from any session).
    online_ids  : Set of participant IDs currently online (from RoomManager).
    """
    interview_session = db.exec(
        select(InterviewSession).where(
            InterviewSession.room_code == room_code.upper()
        )
    ).one()

    all_participants = db.exec(
        select(Participant).where(
            Participant.session_id == interview_session.id
        )
    ).all()

    is_board = participant.seat_role in _BOARD_ROLES
    all_questions = db.exec(
        select(Question).where(
            Question.session_id == interview_session.id
        )
    ).all()

    # Candidate: NEVER see queued questions — Rule 1 / docs/08 role filter.
    visible_questions = (
        all_questions
        if is_board
        else [q for q in all_questions if q.status in _CANDIDATE_VISIBLE_STATUSES]
    )

    # Fetch answers for visible questions only
    q_ids = [q.id for q in visible_questions if q.id is not None]
    answers: dict[int, Answer] = {}
    if q_ids:
        rows = db.exec(
            select(Answer).where(Answer.question_id.in_(q_ids))
        ).all()
        answers = {a.question_id: a for a in rows}

    return {
        "session": {
            "room_code": interview_session.room_code,
            "mode": interview_session.mode,
            "phase": interview_session.phase,
        },
        "participants": [
            _participant_dict(p, online_ids) for p in all_participants
        ],
        "me": _participant_dict(participant, online_ids),
        "questions": [
            _question_dict(q, answers.get(q.id)) for q in visible_questions
        ],
        # No score fields anywhere in this dict — Rule 1.
    }
