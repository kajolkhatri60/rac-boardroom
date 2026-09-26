"""
Integration tests for the live interview loop (Stage 1, Part 3):
- Phase transitions: admit_candidate (requires candidate online & ready), set_phase
- Asking: ask_question (live vs queued, role/phase checks, tag defaulting)
- Answering: submit_answer, pass_question, promoting next queued question
- Role filtering: board sees queued questions, candidate never does
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

import app.db as db_module
import app.models  # noqa: F401
from app.db import get_session
from app.main import app
from app.models.session import (
    InterviewSession,
    Participant,
    Question,
    QuestionStatus,
    SeatRole,
    SessionPhase,
)
from app.realtime import manager as room_manager_module


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_manager():
    room_manager_module._rooms.clear()
    yield
    room_manager_module._rooms.clear()


@pytest.fixture(name="engine")
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)

    original = db_module.engine
    db_module.engine = eng
    yield eng
    db_module.engine = original


@pytest.fixture(name="db_session")
def db_session_fixture(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(db_session: Session):
    def _override():
        return db_session

    app.dependency_overrides[get_session] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_room(client: TestClient, mode: str = "live") -> str:
    res = client.post("/api/sessions", json={"mode": mode})
    assert res.status_code == 201
    return res.json()["room_code"]


def _join(client: TestClient, code: str, display_name: str, seat_role: str, specialisation: str | None = None) -> int:
    body = {"display_name": display_name, "seat_role": seat_role}
    if specialisation:
        body["specialisation"] = specialisation
    res = client.post(f"/api/sessions/{code}/join", json=body)
    assert res.status_code == 201
    return res.json()["id"]


def _setup_full_room(client: TestClient):
    """Returns (room_code, chairman_id, expert_id, candidate_id)."""
    code = _create_room(client)
    chair_id = _join(client, code, "Dr. Mehta", "chairman")
    expert_id = _join(client, code, "Dr. Iyer", "expert", "Radar")
    cand_id = _join(client, code, "Priya Sharma", "candidate")
    return code, chair_id, expert_id, cand_id


# ---------------------------------------------------------------------------
# Tests: Phases & Admission
# ---------------------------------------------------------------------------

def test_admit_before_candidate_online_and_ready(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()  # snapshot

        # 1. Admit when candidate is NOT online at all -> error
        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        err = ws_chair.receive_json()
        assert err["type"] == "error"
        assert "no candidate is currently connected" in err["payload"]["message"].lower()

        # 2. Candidate connects, but has NOT sent lobby_ready yet -> error
        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()  # cand snapshot
            ws_chair.receive_json()  # participant_joined

            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            err = ws_chair.receive_json()
            assert err["type"] == "error"
            assert "candidate is not ready yet" in err["payload"]["message"].lower()

            # 3. Candidate sends lobby_ready -> chairman admits -> everyone gets phase_changed
            ws_cand.send_json({"type": "lobby_ready", "payload": {}})
            chair_got_ready = ws_chair.receive_json()
            assert chair_got_ready["type"] == "candidate_ready"

            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            chair_phase = ws_chair.receive_json()
            cand_phase = ws_cand.receive_json()

            assert chair_phase["type"] == "phase_changed"
            assert chair_phase["payload"]["phase"] == "icebreaker"
            assert cand_phase["type"] == "phase_changed"
            assert cand_phase["payload"]["phase"] == "icebreaker"


def test_non_chairman_cannot_admit_or_set_phase(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_exp:
        ws_exp.receive_json()

        # Expert tries admit
        ws_exp.send_json({"type": "admit_candidate", "payload": {}})
        msg = ws_exp.receive_json()
        assert msg["type"] == "error"
        assert "only the chairman" in msg["payload"]["message"].lower()

        # Expert tries set_phase
        ws_exp.send_json({"type": "set_phase", "payload": {"phase": "technical"}})
        msg = ws_exp.receive_json()
        assert msg["type"] == "error"
        assert "only the chairman" in msg["payload"]["message"].lower()

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
        ws_cand.receive_json()

        # Candidate tries admit
        ws_cand.send_json({"type": "admit_candidate", "payload": {}})
        msg = ws_cand.receive_json()
        assert msg["type"] == "error"
        assert "only the chairman" in msg["payload"]["message"].lower()


def test_set_phase_flow(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()

        # Cannot set_phase while in lobby
        ws_chair.send_json({"type": "set_phase", "payload": {"phase": "technical"}})
        msg = ws_chair.receive_json()
        assert msg["type"] == "error"

        # Candidate connects & readies -> admit
        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()
            ws_chair.receive_json()  # joined

            ws_cand.send_json({"type": "lobby_ready", "payload": {}})
            ws_chair.receive_json()  # candidate_ready

            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            ws_chair.receive_json()  # phase_changed
            ws_cand.receive_json()   # phase_changed

            # Chairman sets phase to technical
            ws_chair.send_json({"type": "set_phase", "payload": {"phase": "technical"}})
            p_chair = ws_chair.receive_json()
            p_cand = ws_cand.receive_json()
            assert p_chair["type"] == "phase_changed"
            assert p_chair["payload"]["phase"] == "technical"
            assert p_cand["type"] == "phase_changed"
            assert p_cand["payload"]["phase"] == "technical"


# ---------------------------------------------------------------------------
# Tests: Asking Questions
# ---------------------------------------------------------------------------

def test_ask_validation(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    # 1. Ask in lobby -> error
    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_exp:
        ws_exp.receive_json()
        ws_exp.send_json({"type": "ask_question", "payload": {"text": "What is radar?"}})
        err = ws_exp.receive_json()
        assert err["type"] == "error"
        assert "interview has not started" in err["payload"]["message"].lower()

    # Admit candidate
    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
        ws_chair.receive_json()
        ws_cand.receive_json()
        ws_chair.receive_json()  # cand joined

        ws_cand.send_json({"type": "lobby_ready", "payload": {}})
        ws_chair.receive_json()  # candidate_ready
        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        ws_chair.receive_json()
        ws_cand.receive_json()

        # 2. Candidate tries to ask -> error
        ws_cand.send_json({"type": "ask_question", "payload": {"text": "Can I ask?"}})
        err = ws_cand.receive_json()
        assert err["type"] == "error"
        assert "only board members" in err["payload"]["message"].lower()

        # 3. Board asks with empty text -> error
        ws_chair.send_json({"type": "ask_question", "payload": {"text": "   "}})
        err = ws_chair.receive_json()
        assert err["type"] == "error"
        assert "cannot be empty" in err["payload"]["message"].lower()


def test_ask_and_queue_flow(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_exp, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:

        # Drain connect messages
        ws_chair.receive_json()
        ws_exp.receive_json()
        ws_chair.receive_json()  # exp joined
        ws_cand.receive_json()
        ws_chair.receive_json()  # cand joined
        ws_exp.receive_json()    # cand joined

        # Ready + Admit
        ws_cand.send_json({"type": "lobby_ready", "payload": {}})
        ws_chair.receive_json()
        ws_exp.receive_json()

        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        ws_chair.receive_json()
        ws_exp.receive_json()
        ws_cand.receive_json()

        # Expert asks Q1 -> live broadcast to ALL
        ws_exp.send_json({"type": "ask_question", "payload": {"text": "Tell us about yourself."}})
        q1_exp = ws_exp.receive_json()
        q1_chair = ws_chair.receive_json()
        q1_cand = ws_cand.receive_json()

        assert q1_exp["type"] == "question_live"
        assert q1_chair["type"] == "question_live"
        assert q1_cand["type"] == "question_live"
        assert q1_cand["payload"]["text"] == "Tell us about yourself."
        assert q1_cand["payload"]["status"] == "live"
        q1_id = q1_cand["payload"]["id"]

        # Chairman asks Q2 while Q1 is live -> queued to BOARD ONLY
        ws_chair.send_json({"type": "ask_question", "payload": {"text": "Explain phase arrays."}})
        q2_chair = ws_chair.receive_json()
        q2_exp = ws_exp.receive_json()

        assert q2_chair["type"] == "question_queued"
        assert q2_exp["type"] == "question_queued"
        assert q2_chair["payload"]["status"] == "queued"

        # Candidate receives NOTHING for queued question. Verify with ping.
        ws_cand.send_json({"type": "ping", "payload": {}})
        cand_pong = ws_cand.receive_json()
        assert cand_pong["type"] == "pong"


def test_answer_and_promotion_flow(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_exp, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:

        # Drain snapshots & joins
        ws_chair.receive_json()
        ws_exp.receive_json()
        ws_chair.receive_json()
        ws_cand.receive_json()
        ws_chair.receive_json()
        ws_exp.receive_json()

        # Ready & Admit
        ws_cand.send_json({"type": "lobby_ready", "payload": {}})
        ws_chair.receive_json()
        ws_exp.receive_json()

        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        ws_chair.receive_json()
        ws_exp.receive_json()
        ws_cand.receive_json()

        # Ask Q1 (live)
        ws_exp.send_json({"type": "ask_question", "payload": {"text": "Question 1"}})
        ws_exp.receive_json()
        ws_chair.receive_json()
        q1 = ws_cand.receive_json()

        # Ask Q2 (queued)
        ws_exp.send_json({"type": "ask_question", "payload": {"text": "Question 2"}})
        ws_exp.receive_json()
        ws_chair.receive_json()

        # 1. Non-candidate tries to answer -> error
        ws_exp.send_json({"type": "submit_answer", "payload": {"question_id": q1["payload"]["id"], "text": "I answer."}})
        err = ws_exp.receive_json()
        assert err["type"] == "error"
        assert "only the candidate" in err["payload"]["message"].lower()

        # 2. Candidate answers non-live question -> error
        ws_cand.send_json({"type": "submit_answer", "payload": {"question_id": 99999, "text": "Fake answer"}})
        err = ws_cand.receive_json()
        assert err["type"] == "error"

        # 3. Candidate answers Q1 successfully
        ws_cand.send_json({"type": "submit_answer", "payload": {"question_id": q1["payload"]["id"], "text": "Answer 1"}})

        # Board receives answer_submitted with duration_s
        ans_chair = ws_chair.receive_json()
        ans_exp = ws_exp.receive_json()
        assert ans_chair["type"] == "answer_submitted"
        assert ans_chair["payload"]["question_id"] == q1["payload"]["id"]
        assert ans_chair["payload"]["passed"] is False
        assert isinstance(ans_chair["payload"]["duration_s"], float)
        assert ans_exp["type"] == "answer_submitted"

        # Candidate receives answer_ack
        cand_ack = ws_cand.receive_json()
        assert cand_ack["type"] == "answer_ack"
        assert cand_ack["payload"]["question_id"] == q1["payload"]["id"]

        # Queued Q2 is now promoted to live -> everyone gets question_live
        promo_chair = ws_chair.receive_json()
        promo_exp = ws_exp.receive_json()
        promo_cand = ws_cand.receive_json()

        assert promo_chair["type"] == "question_live"
        assert promo_exp["type"] == "question_live"
        assert promo_cand["type"] == "question_live"
        assert promo_cand["payload"]["text"] == "Question 2"
        assert promo_cand["payload"]["status"] == "live"

        # 4. Answering an already answered question -> error
        ws_cand.send_json({"type": "submit_answer", "payload": {"question_id": q1["payload"]["id"], "text": "Answer again"}})
        err = ws_cand.receive_json()
        assert err["type"] == "error"
        assert "live question" in err["payload"]["message"].lower() or "already" in err["payload"]["message"].lower()


def test_pass_question_flow(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:

        ws_chair.receive_json()
        ws_cand.receive_json()
        ws_chair.receive_json()  # joined

        ws_cand.send_json({"type": "lobby_ready", "payload": {}})
        ws_chair.receive_json()
        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        ws_chair.receive_json()
        ws_cand.receive_json()

        # Chairman asks a question
        ws_chair.send_json({"type": "ask_question", "payload": {"text": "Do you know quantum gravity?"}})
        ws_chair.receive_json()
        q = ws_cand.receive_json()

        # Candidate passes question
        ws_cand.send_json({"type": "pass_question", "payload": {"question_id": q["payload"]["id"]}})

        # Board receives answer_submitted with passed=true
        board_msg = ws_chair.receive_json()
        assert board_msg["type"] == "answer_submitted"
        assert board_msg["payload"]["passed"] is True
        assert board_msg["payload"]["text"] == ""

        # Candidate gets answer_ack
        cand_ack = ws_cand.receive_json()
        assert cand_ack["type"] == "answer_ack"


def test_tag_defaults_in_managerial_phase(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:

        ws_chair.receive_json()
        ws_cand.receive_json()
        ws_chair.receive_json()

        ws_cand.send_json({"type": "lobby_ready", "payload": {}})
        ws_chair.receive_json()
        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        ws_chair.receive_json()
        ws_cand.receive_json()

        # Change to managerial
        ws_chair.send_json({"type": "set_phase", "payload": {"phase": "managerial"}})
        ws_chair.receive_json()
        ws_cand.receive_json()

        # Ask without specifying tag
        ws_chair.send_json({"type": "ask_question", "payload": {"text": "How do you resolve conflicts?"}})
        q_live = ws_chair.receive_json()
        assert q_live["type"] == "question_live"
        assert q_live["payload"]["tag"] == "managerial"


def test_reconnecting_candidate_snapshot_shows_live_not_queued(client: TestClient):
    code, chair_id, expert_id, cand_id = _setup_full_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair, \
         client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:

        ws_chair.receive_json()
        ws_cand.receive_json()
        ws_chair.receive_json()

        ws_cand.send_json({"type": "lobby_ready", "payload": {}})
        ws_chair.receive_json()
        ws_chair.send_json({"type": "admit_candidate", "payload": {}})
        ws_chair.receive_json()
        ws_cand.receive_json()

        # Q1 (live)
        ws_chair.send_json({"type": "ask_question", "payload": {"text": "Live Question"}})
        ws_chair.receive_json()
        ws_cand.receive_json()

        # Q2 (queued)
        ws_chair.send_json({"type": "ask_question", "payload": {"text": "Queued Question"}})
        ws_chair.receive_json()

    # Reconnect candidate: snapshot should have Q1 (live), but NOT Q2 (queued)
    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand_re:
        snap = ws_cand_re.receive_json()
        assert snap["type"] == "snapshot"
        questions = snap["payload"]["questions"]
        assert len(questions) == 1
        assert questions[0]["text"] == "Live Question"
        assert questions[0]["status"] == "live"
