"""
Tests for the session creation and join endpoints.

Uses an isolated in-memory SQLite database — same pattern as test_health.py.
The existing health test in test_health.py is unaffected.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Import all models so SQLModel.metadata knows about every table
import app.models  # noqa: F401

from app.main import app
from app.db import get_session
from app.models.session import _ROOM_CODE_CHARS


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(name="db_session")
def db_session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(db_session: Session):
    def get_session_override():
        return db_session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def create_session(client: TestClient, mode: str = "live") -> dict:
    """Create a session and return the response JSON."""
    response = client.post("/api/sessions", json={"mode": mode})
    assert response.status_code == 201, response.text
    return response.json()


def join(client: TestClient, room_code: str, display_name: str, seat_role: str, specialisation: str | None = None) -> tuple[int, dict]:
    """Join a session. Returns (status_code, response_json)."""
    body = {"display_name": display_name, "seat_role": seat_role}
    if specialisation:
        body["specialisation"] = specialisation
    response = client.post(f"/api/sessions/{room_code}/join", json=body)
    return response.status_code, response.json()


# ---------------------------------------------------------------------------
# Test: session creation
# ---------------------------------------------------------------------------

def test_create_session_defaults(client: TestClient):
    data = create_session(client)

    # room_code is exactly 6 characters
    assert len(data["room_code"]) == 6

    # All characters must be in the allowed set
    allowed = set(_ROOM_CODE_CHARS)
    assert all(c in allowed for c in data["room_code"]), (
        f"Room code '{data['room_code']}' contains disallowed characters"
    )

    # Confusing characters must not appear
    for forbidden in ("0", "O", "1", "I"):
        assert forbidden not in data["room_code"], (
            f"Room code '{data['room_code']}' contains forbidden char '{forbidden}'"
        )

    assert data["phase"] == "lobby"
    assert data["mode"] == "live"
    assert "id" in data


def test_create_session_practice(client: TestClient):
    data = create_session(client, mode="practice")
    assert data["mode"] == "practice"
    assert data["phase"] == "lobby"


# ---------------------------------------------------------------------------
# Test: joining — happy path
# ---------------------------------------------------------------------------

def test_join_chairman_candidate_four_experts(client: TestClient):
    code = create_session(client)["room_code"]

    status_code, body = join(client, code, "Dr. Mehta", "chairman")
    assert status_code == 201, body
    assert body["seat_role"] == "chairman"

    status_code, body = join(client, code, "Priya Sharma", "candidate")
    assert status_code == 201, body
    assert body["seat_role"] == "candidate"

    for i in range(1, 5):
        status_code, body = join(client, code, f"Expert {i}", "expert", f"Domain {i}")
        assert status_code == 201, f"Expert {i} join failed: {body}"
        assert body["seat_role"] == "expert"


# ---------------------------------------------------------------------------
# Test: seat limit violations
# ---------------------------------------------------------------------------

def test_fifth_expert_rejected(client: TestClient):
    code = create_session(client)["room_code"]
    for i in range(1, 5):
        sc, _ = join(client, code, f"Expert {i}", "expert")
        assert sc == 201

    sc, body = join(client, code, "Expert 5", "expert")
    assert sc == 409
    assert "expert" in body["detail"].lower()


def test_second_candidate_rejected(client: TestClient):
    code = create_session(client)["room_code"]

    sc, _ = join(client, code, "Priya", "candidate")
    assert sc == 201

    sc, body = join(client, code, "Ravi", "candidate")
    assert sc == 409
    assert "candidate" in body["detail"].lower()


def test_second_chairman_rejected(client: TestClient):
    code = create_session(client)["room_code"]

    sc, _ = join(client, code, "Dr. Mehta", "chairman")
    assert sc == 201

    sc, body = join(client, code, "Dr. Singh", "chairman")
    assert sc == 409
    assert "chairman" in body["detail"].lower()


# ---------------------------------------------------------------------------
# Test: unknown room → 404
# ---------------------------------------------------------------------------

def test_join_unknown_room(client: TestClient):
    sc, body = join(client, "ZZZZZZ", "Someone", "candidate")
    assert sc == 404
    assert "ZZZZZZ" in body["detail"]


# ---------------------------------------------------------------------------
# Test: joining after lobby phase → 409
# ---------------------------------------------------------------------------

def test_join_after_lobby_rejected(client: TestClient, db_session: Session):
    from app.models.session import InterviewSession, SessionPhase
    from sqlmodel import select

    code = create_session(client)["room_code"]

    # Advance phase directly in the DB
    session_row = db_session.exec(
        select(InterviewSession).where(InterviewSession.room_code == code)
    ).one()
    session_row.phase = SessionPhase.technical
    db_session.add(session_row)
    db_session.commit()

    sc, body = join(client, code, "Priya", "candidate")
    assert sc == 409
    assert "lobby" in body["detail"]


# ---------------------------------------------------------------------------
# Test: GET session detail
# ---------------------------------------------------------------------------

def test_get_session_returns_participants(client: TestClient):
    code = create_session(client)["room_code"]
    join(client, code, "Dr. Mehta", "chairman")
    join(client, code, "Priya", "candidate")
    join(client, code, "Dr. Iyer", "expert", "Radar Systems")

    response = client.get(f"/api/sessions/{code}")
    assert response.status_code == 200
    data = response.json()

    assert data["room_code"] == code
    assert data["phase"] == "lobby"

    roles = {p["seat_role"] for p in data["participants"]}
    assert roles == {"chairman", "candidate", "expert"}
    assert len(data["participants"]) == 3

    expert = next(p for p in data["participants"] if p["seat_role"] == "expert")
    assert expert["specialisation"] == "Radar Systems"


def test_get_unknown_session(client: TestClient):
    response = client.get("/api/sessions/BADCOD")
    assert response.status_code == 404
