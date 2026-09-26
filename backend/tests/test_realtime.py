"""
Integration tests for the WebSocket room endpoint (Stage 1, Part 2).

Fixture strategy
----------------
* ``test_engine``: creates an in-memory SQLite DB with StaticPool, patches
  ``app.db.engine`` so both HTTP handlers (via ``get_session``) and
  WebSocket handlers (via ``session_ctx``) use the same in-memory database.
* ``db_session``: a persistent Session from the test engine (used for
  direct DB setup inside tests).
* ``client``: TestClient with ``get_session`` overridden to return
  ``db_session``, and autouse ``reset_manager`` to clear the room manager.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool
from starlette.websockets import WebSocketDisconnect

# Import app.db as an alias BEFORE importing 'app' from app.main.
# 'from app.main import app' would shadow the 'app' package name in this
# module's namespace, making 'app.db' resolve to the FastAPI instance's
# non-existent .db attribute instead of the module.
import app.db as db_module
import app.models  # noqa: F401 — register all SQLModel tables

from app.db import get_session
from app.main import app
from app.models.session import (
    InterviewSession,
    Participant,
    Question,
    QuestionStatus,
    QuestionTag,
    SeatRole,
    SessionPhase,
)
from app.realtime import manager as room_manager_module


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _has_score_key(obj) -> bool:
    """Recursively check whether any dict key contains the word 'score'."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if "score" in str(k).lower():
                return True
            if _has_score_key(v):
                return True
    elif isinstance(obj, list):
        return any(_has_score_key(item) for item in obj)
    return False


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_manager():
    """Clear the global RoomManager before and after every test."""
    room_manager_module._rooms.clear()
    yield
    room_manager_module._rooms.clear()


@pytest.fixture(name="engine")
def engine():
    """
    In-memory SQLite engine. Patches db_module.engine (which is app.db.engine)
    so that session_ctx() used by WS handlers also uses this engine.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    original = db_module.engine
    db_module.engine = engine
    yield engine
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
# Room / participant setup helpers
# ---------------------------------------------------------------------------

def _create_room(client: TestClient, mode: str = "live") -> str:
    res = client.post("/api/sessions", json={"mode": mode})
    assert res.status_code == 201, res.text
    return res.json()["room_code"]


def _join(client: TestClient, code: str, display_name: str, seat_role: str, specialisation: str | None = None) -> int:
    body = {"display_name": display_name, "seat_role": seat_role}
    if specialisation:
        body["specialisation"] = specialisation
    res = client.post(f"/api/sessions/{code}/join", json=body)
    assert res.status_code == 201, res.text
    return res.json()["id"]


def _setup_room(client: TestClient):
    """Create a room with one expert and one candidate. Returns (code, expert_id, candidate_id)."""
    code = _create_room(client)
    expert_id = _join(client, code, "Dr. Iyer", "expert", "Radar Systems")
    cand_id = _join(client, code, "Priya Sharma", "candidate")
    return code, expert_id, cand_id


# ---------------------------------------------------------------------------
# Test 1: valid connect — first message is "snapshot"
# ---------------------------------------------------------------------------

def test_valid_connect_snapshot(client: TestClient):
    code, expert_id, cand_id = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws:
        msg = ws.receive_json()

    assert msg["type"] == "snapshot"
    payload = msg["payload"]
    assert payload["session"]["room_code"] == code
    assert isinstance(payload["participants"], list)
    assert len(payload["participants"]) == 2
    assert "me" in payload
    assert payload["me"]["seat_role"] == "expert"
    assert payload["me"]["id"] == expert_id


# ---------------------------------------------------------------------------
# Test 2a: unknown room → rejected with 4404
# ---------------------------------------------------------------------------

def test_unknown_room_rejected(client: TestClient):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/sessions/ZZZZZZ?participant_id=1") as ws:
            ws.receive_json()
    assert exc_info.value.code == 4404


# ---------------------------------------------------------------------------
# Test 2b: participant not in this room → rejected with 4403
# ---------------------------------------------------------------------------

def test_participant_from_other_room_rejected(client: TestClient):
    code_a = _create_room(client)
    code_b = _create_room(client)

    # Participant belongs to room A only
    p_id = _join(client, code_a, "Outsider", "candidate")

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/sessions/{code_b}?participant_id={p_id}") as ws:
            ws.receive_json()
    assert exc_info.value.code == 4403


# ---------------------------------------------------------------------------
# Test 3: board sees queued question; candidate does NOT
# ---------------------------------------------------------------------------

def test_board_sees_queued_candidate_does_not(client: TestClient, db_session: Session):
    code, expert_id, cand_id = _setup_room(client)

    # Insert a queued question directly into the test DB
    session_row = db_session.exec(
        select(InterviewSession).where(InterviewSession.room_code == code)
    ).one()

    q = Question(
        session_id=session_row.id,
        asked_by=expert_id,
        seq=1,
        text="Explain CFAR detection in radar systems.",
        phase=SessionPhase.technical,
        tag=QuestionTag.technical,
        status=QuestionStatus.queued,
    )
    db_session.add(q)
    db_session.commit()

    # Board member (expert) sees the question
    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws:
        msg = ws.receive_json()
    assert msg["type"] == "snapshot"
    assert len(msg["payload"]["questions"]) == 1
    assert msg["payload"]["questions"][0]["status"] == "queued"

    # Candidate does NOT see the queued question
    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws:
        msg = ws.receive_json()
    assert msg["type"] == "snapshot"
    assert len(msg["payload"]["questions"]) == 0


# ---------------------------------------------------------------------------
# Test 4: recursive "no score key" check in candidate snapshot
# ---------------------------------------------------------------------------

def test_no_score_key_in_candidate_snapshot(client: TestClient):
    code, _, cand_id = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws:
        msg = ws.receive_json()

    assert msg["type"] == "snapshot"
    assert not _has_score_key(msg["payload"]), (
        "Candidate snapshot must contain no key with 'score' — Rule 1 violation."
    )


# ---------------------------------------------------------------------------
# Test 5: participant_joined broadcast when candidate connects
# ---------------------------------------------------------------------------

def test_participant_joined_broadcast(client: TestClient):
    code, expert_id, cand_id = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_expert:
        ws_expert.receive_json()  # drain expert snapshot

        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()  # drain candidate snapshot

            # Expert must now have received participant_joined for the candidate
            joined = ws_expert.receive_json()

    assert joined["type"] == "participant_joined"
    assert joined["payload"]["participant_id"] == cand_id
    assert joined["payload"]["seat_role"] == "candidate"


# ---------------------------------------------------------------------------
# Test 6: lobby_ready from candidate → expert gets candidate_ready
# ---------------------------------------------------------------------------

def test_lobby_ready_candidate(client: TestClient):
    code, expert_id, cand_id = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_expert:
        ws_expert.receive_json()  # drain snapshot

        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()  # drain snapshot
            ws_expert.receive_json()  # drain participant_joined

            ws_cand.send_json({"type": "lobby_ready", "payload": {}})

            # Expert receives candidate_ready
            ready_msg = ws_expert.receive_json()

            # Candidate itself should NOT receive candidate_ready.
            # Verify by sending ping and checking pong is next for candidate.
            ws_cand.send_json({"type": "ping", "payload": {}})
            cand_next = ws_cand.receive_json()

    assert ready_msg["type"] == "candidate_ready"
    assert cand_next["type"] == "pong", (
        f"Candidate should only receive pong, got '{cand_next['type']}'"
    )


# ---------------------------------------------------------------------------
# Test 7: lobby_ready from expert → expert gets error
# ---------------------------------------------------------------------------

def test_lobby_ready_from_non_candidate_gets_error(client: TestClient):
    code, expert_id, _ = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws:
        ws.receive_json()  # drain snapshot
        ws.send_json({"type": "lobby_ready", "payload": {}})
        msg = ws.receive_json()

    assert msg["type"] == "error"
    assert "candidate" in msg["payload"]["message"].lower()


# ---------------------------------------------------------------------------
# Test 8a: ping → pong
# ---------------------------------------------------------------------------

def test_ping_pong(client: TestClient):
    code, expert_id, _ = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws:
        ws.receive_json()  # drain snapshot
        ws.send_json({"type": "ping", "payload": {}})
        msg = ws.receive_json()

    assert msg["type"] == "pong"


# ---------------------------------------------------------------------------
# Test 8b: bad JSON → error, connection stays open
# ---------------------------------------------------------------------------

def test_bad_json_sends_error_and_connection_stays_open(client: TestClient):
    code, expert_id, _ = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws:
        ws.receive_json()  # drain snapshot

        ws.send_text("this is not json {{{{")
        error_msg = ws.receive_json()

        # Connection should still be alive
        ws.send_json({"type": "ping", "payload": {}})
        pong_msg = ws.receive_json()

    assert error_msg["type"] == "error"
    assert pong_msg["type"] == "pong"


# ---------------------------------------------------------------------------
# Test 9: reconnect safety — second connection replaces first;
#          board does NOT receive participant_left
# ---------------------------------------------------------------------------

def test_reconnect_does_not_trigger_participant_left(client: TestClient):
    """
    Simulates a page-refresh: the candidate opens a second WebSocket while
    the first is still registered. The manager closes the old connection,
    stores the new one, and because disconnect() sees a different ws object,
    it does NOT broadcast participant_left.

    After the reconnect the candidate is still online and the expert's next
    message is pong (from its own ping), confirming no participant_left was
    queued in between.
    """
    code, expert_id, cand_id = _setup_room(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={expert_id}") as ws_expert:
        ws_expert.receive_json()  # drain expert snapshot

        # First candidate connection
        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand1:
            ws_cand1.receive_json()  # drain snapshot
            ws_expert.receive_json()  # drain participant_joined for candidate

            # Second candidate connection (page refresh — same participant_id)
            with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand2:
                ws_cand2.receive_json()  # drain new snapshot (is_new=False → no participant_joined broadcast)

                # Expert should have received NOTHING (no participant_left, no participant_joined).
                # Verify by sending a ping from the expert — pong must be the very next message.
                ws_expert.send_json({"type": "ping", "payload": {}})
                next_for_expert = ws_expert.receive_json()

                # New candidate connection is alive
                ws_cand2.send_json({"type": "ping", "payload": {}})
                cand2_pong = ws_cand2.receive_json()

    assert next_for_expert["type"] == "pong", (
        f"Expected pong but got '{next_for_expert['type']}' — "
        "participant_left or participant_joined was incorrectly broadcast on reconnect."
    )
    assert cand2_pong["type"] == "pong", "New candidate connection should be alive and responsive."
