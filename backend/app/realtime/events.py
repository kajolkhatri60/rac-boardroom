"""
Business logic for live interview WebSocket events.

Each handler:
  - Opens its own short-lived DB session (Rule D20: save before broadcast).
  - Validates inputs and role; sends error to sender on failure.
  - Commits to DB, then broadcasts/sends.

Handlers in this module:
  handle_admit_candidate   — chairman only; lobby → icebreaker
  handle_set_phase         — chairman only; any started phase → another allowed phase
  handle_ask_question      — board only; creates Question; live or queued
  handle_submit_answer     — candidate only; saves Answer; promotes next queued question
  handle_pass_question     — candidate only; same flow as submit, passed=True
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlmodel import func, select

import app.db
from app.models.proctor import ALLOWED_PROCTOR_EVENT_TYPES, ProctorEvent
from app.models.session import (
    Answer,
    InterviewSession,
    Participant,
    Question,
    QuestionStatus,
    QuestionTag,
    SeatRole,
    SessionPhase,
)
from app.realtime.manager import RoomManager
from app.schemas.ws import make_error_message, make_ws_message

logger = logging.getLogger(__name__)

_BOARD_ROLES = {SeatRole.chairman, SeatRole.expert}
_ALLOWED_SET_PHASES = {
    SessionPhase.icebreaker,
    SessionPhase.technical,
    SessionPhase.managerial,
    SessionPhase.closing,
}
_MAX_QUESTION_LEN = 2000
_MAX_ANSWER_LEN = 5000


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _err(manager: RoomManager, participant: Participant, room_code: str, msg: str) -> None:
    await manager.send_to(participant.id, make_error_message(msg), room_code=room_code)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_aware(dt: datetime) -> datetime:
    """Make a datetime timezone-aware (assume UTC if naive)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _question_event_dict(
    q_id: int,
    q_seq: int,
    q_text: str,
    q_tag: str,
    q_phase: str,
    q_status: str,
    q_follow_up: int | None,
    asker_id: int,
    asker_name: str,
) -> dict:
    """Build the payload shared by question_live and question_queued events."""
    return {
        "id": q_id,
        "seq": q_seq,
        "text": q_text,
        "tag": q_tag,
        "phase": q_phase,
        "status": q_status,
        "follow_up_of": q_follow_up,
        "asked_by": {"id": asker_id, "display_name": asker_name},
    }


# ---------------------------------------------------------------------------
# Phase handlers
# ---------------------------------------------------------------------------

async def handle_admit_candidate(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    """
    admit_candidate — chairman only.
    Phase must be lobby.
    Candidate must be online AND have sent lobby_ready (ready_at is set).
    Transitions: lobby → icebreaker, sets started_at.
    """
    if participant.seat_role != SeatRole.chairman:
        await _err(manager, participant, room_code, "Only the chairman can admit the candidate.")
        return

    with app.db.session_ctx() as db:
        session = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == room_code)
        ).one()

        if session.phase != SessionPhase.lobby:
            await _err(manager, participant, room_code,
                       "Candidate is already admitted — session is already in progress.")
            return

        online_ids = manager.online_ids(room_code)

        candidate = db.exec(
            select(Participant).where(
                Participant.session_id == session.id,
                Participant.seat_role == SeatRole.candidate,
            )
        ).first()

        if candidate is None or candidate.id not in online_ids:
            await _err(manager, participant, room_code, "No candidate is currently connected.")
            return

        if not candidate.ready_at:
            await _err(manager, participant, room_code, "Candidate is not ready yet.")
            return

        session.phase = SessionPhase.icebreaker
        session.started_at = _utc_now()
        db.add(session)
        db.commit()

    await manager.broadcast(
        room_code,
        make_ws_message("phase_changed", {"phase": SessionPhase.icebreaker}),
    )


async def handle_set_phase(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    """
    set_phase — chairman only.
    Allowed values: icebreaker, technical, managerial, closing.
    Must not be in lobby (interview must have started via admit_candidate).
    """
    if participant.seat_role != SeatRole.chairman:
        await _err(manager, participant, room_code, "Only the chairman can change the phase.")
        return

    raw_phase = payload.get("phase", "")
    try:
        new_phase = SessionPhase(raw_phase)
    except ValueError:
        await _err(manager, participant, room_code, f"Unknown phase '{raw_phase}'.")
        return

    if new_phase not in _ALLOWED_SET_PHASES:
        await _err(
            manager, participant, room_code,
            f"Phase '{new_phase}' cannot be set via set_phase. "
            "Allowed: icebreaker, technical, managerial, closing.",
        )
        return

    with app.db.session_ctx() as db:
        session = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == room_code)
        ).one()

        if session.phase == SessionPhase.lobby:
            await _err(manager, participant, room_code,
                       "Cannot change phase before the interview has started. "
                       "Use admit_candidate first.")
            return

        session.phase = new_phase
        db.add(session)
        db.commit()

    await manager.broadcast(
        room_code,
        make_ws_message("phase_changed", {"phase": new_phase}),
    )


# ---------------------------------------------------------------------------
# Question handler
# ---------------------------------------------------------------------------

async def handle_ask_question(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    """
    ask_question — board (chairman or expert) only.
    Validates: phase not lobby, text not empty/too long, follow_up_of in session.
    Tag defaults to managerial in managerial phase, else technical.
    Saves with status live (no live question exists) or queued (one already live).
    Broadcasts question_live to all, or sends question_queued to board only.
    Candidate never receives queued questions — Rule 1 / docs/08.
    """
    if participant.seat_role not in _BOARD_ROLES:
        await _err(manager, participant, room_code, "Only board members can ask questions.")
        return

    text = (payload.get("text") or "").strip()
    if not text:
        await _err(manager, participant, room_code, "Question text cannot be empty.")
        return
    if len(text) > _MAX_QUESTION_LEN:
        await _err(manager, participant, room_code,
                   f"Question text is too long (max {_MAX_QUESTION_LEN} characters).")
        return

    raw_tag = payload.get("tag")
    follow_up_of = payload.get("follow_up_of")

    # --- DB work (open → validate → save → commit → close) ---
    # Capture all scalar values we need before the session closes.
    q_id = q_seq = q_text = q_tag = q_phase = q_status = q_follow_up = None
    has_live = False

    with app.db.session_ctx() as db:
        session = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == room_code)
        ).one()

        if session.phase == SessionPhase.lobby:
            await _err(manager, participant, room_code, "Interview has not started.")
            return

        # Validate follow_up_of
        if follow_up_of is not None:
            parent = db.exec(
                select(Question).where(
                    Question.id == follow_up_of,
                    Question.session_id == session.id,
                )
            ).first()
            if parent is None:
                await _err(manager, participant, room_code,
                           f"Question {follow_up_of} does not exist in this session.")
                return

        # Resolve tag
        if raw_tag:
            try:
                tag = QuestionTag(raw_tag)
            except ValueError:
                await _err(manager, participant, room_code, f"Unknown tag '{raw_tag}'.")
                return
        else:
            tag = (
                QuestionTag.managerial
                if session.phase == SessionPhase.managerial
                else QuestionTag.technical
            )

        # Compute seq
        existing = db.exec(
            select(Question).where(Question.session_id == session.id)
        ).all()
        seq = len(existing) + 1

        # Is there already a live question?
        live_q = next((q for q in existing if q.status == QuestionStatus.live), None)
        has_live = live_q is not None

        now = _utc_now()
        new_q = Question(
            session_id=session.id,
            asked_by=participant.id,
            seq=seq,
            text=text,
            phase=session.phase,
            tag=tag,
            follow_up_of=follow_up_of,
            status=QuestionStatus.queued if has_live else QuestionStatus.live,
            live_at=None if has_live else now,
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)

        # Capture values before session closes
        q_id = new_q.id
        q_seq = new_q.seq
        q_text = new_q.text
        q_tag = new_q.tag
        q_phase = new_q.phase
        q_status = new_q.status
        q_follow_up = new_q.follow_up_of

    q_dict = _question_event_dict(
        q_id, q_seq, q_text, q_tag, q_phase, q_status, q_follow_up,
        participant.id, participant.display_name,
    )

    if not has_live:
        # No prior live question — this is now live; broadcast to everyone.
        await manager.broadcast(room_code, make_ws_message("question_live", q_dict))
    else:
        # Already a live question — this is queued.
        # Candidate NEVER receives queued questions — Rule 1 / docs/08.
        await manager.send_to_roles(room_code, _BOARD_ROLES,
                                     make_ws_message("question_queued", q_dict))


# ---------------------------------------------------------------------------
# Answer / pass helpers
# ---------------------------------------------------------------------------

async def _promote_oldest_queued(
    session_id: int,
    room_code: str,
    manager: RoomManager,
) -> None:
    """
    Promote the queued question with the lowest seq to live and broadcast
    question_live to everyone (including candidate — it is now live, visible).
    """
    with app.db.session_ctx() as db:
        queued = db.exec(
            select(Question).where(
                Question.session_id == session_id,
                Question.status == QuestionStatus.queued,
            )
        ).all()

        if not queued:
            return

        oldest = min(queued, key=lambda q: q.seq)
        oldest.status = QuestionStatus.live
        oldest.live_at = _utc_now()
        db.add(oldest)

        asker = db.exec(
            select(Participant).where(Participant.id == oldest.asked_by)
        ).one()
        db.commit()
        db.refresh(oldest)

        q_dict = _question_event_dict(
            oldest.id, oldest.seq, oldest.text, oldest.tag,
            oldest.phase, oldest.status, oldest.follow_up_of,
            asker.id, asker.display_name,
        )

    await manager.broadcast(room_code, make_ws_message("question_live", q_dict))


async def _handle_answer_or_pass(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
    *,
    passing: bool,
) -> None:
    """
    Shared logic for submit_answer and pass_question.

    passing=False: submit_answer — text required, Question → answered.
    passing=True:  pass_question  — text ignored,  Question → passed.

    Rule D20: save to DB first, then send events.
    """
    if participant.seat_role != SeatRole.candidate:
        action = "pass" if passing else "submit an answer to"
        await _err(manager, participant, room_code,
                   f"Only the candidate can {action} a question.")
        return

    question_id = payload.get("question_id")
    if not isinstance(question_id, int):
        await _err(manager, participant, room_code, "question_id must be an integer.")
        return

    text = ""
    if not passing:
        text = (payload.get("text") or "").strip()
        if not text:
            await _err(manager, participant, room_code, "Answer text cannot be empty.")
            return
        if len(text) > _MAX_ANSWER_LEN:
            await _err(manager, participant, room_code,
                       f"Answer is too long (max {_MAX_ANSWER_LEN} characters).")
            return

    session_id = None
    answer_payload = None

    with app.db.session_ctx() as db:
        session = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == room_code)
        ).one()
        session_id = session.id

        q = db.exec(
            select(Question).where(
                Question.id == question_id,
                Question.session_id == session.id,
            )
        ).first()

        if q is None:
            await _err(manager, participant, room_code,
                       f"Question {question_id} does not exist in this session.")
            return

        if q.status != QuestionStatus.live:
            await _err(manager, participant, room_code,
                       "You can only answer or pass the current live question.")
            return

        existing_answer = db.exec(
            select(Answer).where(Answer.question_id == question_id)
        ).first()
        if existing_answer is not None:
            await _err(manager, participant, room_code,
                       "This question has already been answered or passed.")
            return

        now = _utc_now()
        duration_s: float | None = None
        if q.live_at:
            duration_s = (now - _ensure_aware(q.live_at)).total_seconds()

        new_answer = Answer(
            question_id=question_id,
            text=text,
            passed=passing,
            submitted_at=now,
            duration_s=duration_s,
        )
        db.add(new_answer)

        q.status = QuestionStatus.passed if passing else QuestionStatus.answered
        db.add(q)
        db.commit()

        answer_payload = {
            "question_id": question_id,
            "text": text,
            "passed": passing,
            "duration_s": duration_s,
        }

    # Rule D20: DB committed; now broadcast.
    await manager.send_to_roles(
        room_code, _BOARD_ROLES,
        make_ws_message("answer_submitted", answer_payload),
    )
    await manager.send_to(
        participant.id,
        make_ws_message("answer_ack", {"question_id": question_id}),
        room_code=room_code,
    )
    await _promote_oldest_queued(session_id, room_code, manager)


# ---------------------------------------------------------------------------
# Public answer / pass entry points
# ---------------------------------------------------------------------------

async def handle_submit_answer(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    await _handle_answer_or_pass(payload, participant, room_code, manager, passing=False)


async def handle_pass_question(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    await _handle_answer_or_pass(payload, participant, room_code, manager, passing=True)


# ---------------------------------------------------------------------------
# Proctor event handler (Rule G / S4a)
# ---------------------------------------------------------------------------

async def handle_proctor_event(
    payload: dict,
    participant: Participant,
    room_code: str,
    manager: RoomManager,
) -> None:
    """
    proctor_event — candidate only.
    Saved silently to DB.
    Never broadcast to board, candidate, or anyone.
    Allowed only after admit (session.phase != lobby).
    Validates type, duration_s (0-7200s), and rate limit (max 60/min).
    """
    if participant.seat_role != SeatRole.candidate:
        await _err(manager, participant, room_code, "Only the candidate can report proctor events.")
        return

    event_type = payload.get("type")
    if event_type not in ALLOWED_PROCTOR_EVENT_TYPES:
        await _err(
            manager, participant, room_code,
            f"Invalid proctor event type '{event_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_PROCTOR_EVENT_TYPES))}.",
        )
        return

    duration_s = payload.get("duration_s")
    if not isinstance(duration_s, (int, float)) or duration_s < 0 or duration_s > 7200:
        await _err(
            manager, participant, room_code,
            "duration_s must be a number between 0 and 7200.",
        )
        return

    started_at_raw = payload.get("started_at")
    if isinstance(started_at_raw, str):
        try:
            started_at = datetime.fromisoformat(started_at_raw.replace("Z", "+00:00"))
        except Exception:
            await _err(manager, participant, room_code, "Invalid started_at ISO format.")
            return
    elif isinstance(started_at_raw, (int, float)):
        try:
            started_at = datetime.fromtimestamp(started_at_raw, tz=timezone.utc)
        except Exception:
            await _err(manager, participant, room_code, "Invalid started_at timestamp.")
            return
    elif isinstance(started_at_raw, datetime):
        started_at = _ensure_aware(started_at_raw)
    else:
        started_at = _utc_now()

    started_at = _ensure_aware(started_at)

    with app.db.session_ctx() as db:
        session = db.exec(
            select(InterviewSession).where(InterviewSession.room_code == room_code)
        ).first()

        if not session:
            await _err(manager, participant, room_code, "Session not found.")
            return

        if session.phase == SessionPhase.lobby:
            await _err(
                manager, participant, room_code,
                "Proctor events are only accepted after candidate is admitted.",
            )
            return

        # Rate limit: max 60 per minute per participant
        one_min_ago = _utc_now() - timedelta(seconds=60)
        recent_count = db.exec(
            select(func.count(ProctorEvent.id)).where(
                ProctorEvent.participant_id == participant.id,
                ProctorEvent.created_at >= one_min_ago,
            )
        ).one()

        if recent_count >= 60:
            await _err(
                manager, participant, room_code,
                "Rate limit exceeded: max 60 proctor events per minute.",
            )
            return

        event = ProctorEvent(
            session_id=session.id,
            participant_id=participant.id,
            type=event_type,
            started_at=started_at,
            duration_s=float(duration_s),
        )
        db.add(event)
        db.commit()

    # Rule: Save only, do NOT broadcast or notify anyone.
