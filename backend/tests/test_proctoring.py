"""
Tests for candidate proctoring (S4a):
- Candidate reports proctor events silently to server.
- Saved to DB; board receives nothing.
- Rejected if sent by board member.
- Rejected if session is in lobby (before admission).
- Rejected if invalid type or invalid duration.
- Dev endpoint GET /api/dev/sessions/{room_code}/proctor-events returns events when DEMO_MODE=true, 404 when DEMO_MODE=false.
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

import app.db as db_module
import app.models  # noqa: F401
from app.config import settings
from app.db import get_session
from app.main import app
from app.models.proctor import ProctorEvent
from app.realtime import manager as room_manager_module


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


def _create_room(client: TestClient, mode: str = "live") -> str:
    res = client.post("/api/sessions", json={"mode": mode})
    assert res.status_code == 201
    return res.json()["room_code"]


def _join(client: TestClient, code: str, display_name: str, seat_role: str) -> int:
    res = client.post(
        f"/api/sessions/{code}/join",
        json={"display_name": display_name, "seat_role": seat_role},
    )
    assert res.status_code == 201
    return res.json()["id"]


def _setup_admitted_session(client: TestClient):
    """Creates room, joins chair and candidate, connects WS, admits candidate."""
    code = _create_room(client)
    chair_id = _join(client, code, "Dr. Chairman", "chairman")
    cand_id = _join(client, code, "Candidate One", "candidate")
    return code, chair_id, cand_id


def test_proctor_event_after_admit_saved_and_board_gets_nothing(client: TestClient, db_session: Session):
    code, chair_id, cand_id = _setup_admitted_session(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()  # chair snapshot

        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()  # cand snapshot
            ws_chair.receive_json()  # participant_joined

            # Ready and admit
            ws_cand.send_json({"type": "lobby_ready", "payload": {}})
            ws_chair.receive_json()  # candidate_ready
            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            ws_chair.receive_json()  # phase_changed
            ws_cand.receive_json()  # phase_changed

            # Candidate reports valid proctor event
            started_iso = datetime.now(timezone.utc).isoformat()
            ws_cand.send_json({
                "type": "proctor_event",
                "payload": {
                    "type": "face_missing",
                    "started_at": started_iso,
                    "duration_s": 4.2,
                },
            })

            # Check board receives nothing: ping chair and verify the immediate response is pong
            ws_chair.send_json({"type": "ping", "payload": {}})
            pong = ws_chair.receive_json()
            assert pong["type"] == "pong"

            # Verify saved in DB
            events = db_session.exec(
                select(ProctorEvent).where(ProctorEvent.participant_id == cand_id)
            ).all()
            assert len(events) == 1
            assert events[0].type == "face_missing"
            assert pytest.approx(events[0].duration_s, 0.01) == 4.2


def test_proctor_event_by_board_member_rejected(client: TestClient):
    code, chair_id, cand_id = _setup_admitted_session(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()  # snapshot

        ws_chair.send_json({
            "type": "proctor_event",
            "payload": {
                "type": "tab_hidden",
                "started_at": datetime.now(timezone.utc).isoformat(),
                "duration_s": 5.0,
            },
        })
        err = ws_chair.receive_json()
        assert err["type"] == "error"
        assert "only the candidate can report proctor events" in err["payload"]["message"].lower()


def test_proctor_event_in_lobby_rejected(client: TestClient):
    code, chair_id, cand_id = _setup_admitted_session(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
        ws_cand.receive_json()  # snapshot

        # Session is still in lobby
        ws_cand.send_json({
            "type": "proctor_event",
            "payload": {
                "type": "multiple_faces",
                "started_at": datetime.now(timezone.utc).isoformat(),
                "duration_s": 3.0,
            },
        })
        err = ws_cand.receive_json()
        assert err["type"] == "error"
        assert "only accepted after candidate is admitted" in err["payload"]["message"].lower()


def test_proctor_event_invalid_type_rejected(client: TestClient):
    code, chair_id, cand_id = _setup_admitted_session(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()
        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()
            ws_chair.receive_json()

            ws_cand.send_json({"type": "lobby_ready", "payload": {}})
            ws_chair.receive_json()
            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            ws_chair.receive_json()
            ws_cand.receive_json()

            ws_cand.send_json({
                "type": "proctor_event",
                "payload": {
                    "type": "looking_away",  # invalid type
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "duration_s": 2.5,
                },
            })
            err = ws_cand.receive_json()
            assert err["type"] == "error"
            assert "invalid proctor event type" in err["payload"]["message"].lower()


def test_proctor_event_invalid_duration_rejected(client: TestClient):
    code, chair_id, cand_id = _setup_admitted_session(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()
        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()
            ws_chair.receive_json()

            ws_cand.send_json({"type": "lobby_ready", "payload": {}})
            ws_chair.receive_json()
            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            ws_chair.receive_json()
            ws_cand.receive_json()

            # Negative duration
            ws_cand.send_json({
                "type": "proctor_event",
                "payload": {
                    "type": "window_blur",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "duration_s": -1.0,
                },
            })
            err = ws_cand.receive_json()
            assert err["type"] == "error"
            assert "duration_s must be a number between 0 and 7200" in err["payload"]["message"].lower()

            # Excessively large duration (>7200)
            ws_cand.send_json({
                "type": "proctor_event",
                "payload": {
                    "type": "window_blur",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "duration_s": 8000.0,
                },
            })
            err2 = ws_cand.receive_json()
            assert err2["type"] == "error"
            assert "duration_s must be a number between 0 and 7200" in err2["payload"]["message"].lower()


def test_dev_endpoint_proctor_events(client: TestClient, monkeypatch):
    code, chair_id, cand_id = _setup_admitted_session(client)

    with client.websocket_connect(f"/ws/sessions/{code}?participant_id={chair_id}") as ws_chair:
        ws_chair.receive_json()
        with client.websocket_connect(f"/ws/sessions/{code}?participant_id={cand_id}") as ws_cand:
            ws_cand.receive_json()
            ws_chair.receive_json()

            ws_cand.send_json({"type": "lobby_ready", "payload": {}})
            ws_chair.receive_json()
            ws_chair.send_json({"type": "admit_candidate", "payload": {}})
            ws_chair.receive_json()
            ws_cand.receive_json()

            ws_cand.send_json({
                "type": "proctor_event",
                "payload": {
                    "type": "tab_hidden",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "duration_s": 2.1,
                },
            })
            ws_cand.send_json({
                "type": "proctor_event",
                "payload": {
                    "type": "face_missing",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "duration_s": 3.4,
                },
            })

    # When DEMO_MODE=true
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    res = client.get(f"/api/dev/sessions/{code}/proctor-events")
    assert res.status_code == 200
    events = res.json()
    assert len(events) == 2
    assert events[0]["type"] == "tab_hidden"
    assert pytest.approx(events[0]["duration_s"], 0.01) == 2.1
    assert events[1]["type"] == "face_missing"
    assert pytest.approx(events[1]["duration_s"], 0.01) == 3.4

    # When DEMO_MODE=false
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    res_disabled = client.get(f"/api/dev/sessions/{code}/proctor-events")
    assert res_disabled.status_code == 404
