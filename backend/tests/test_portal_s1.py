from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from app.main import app
from app.db import get_session
from app.models.portal import User, UserRole, Post, PostStatus, RequirementKind
from app.seed import seed_demo_accounts
from app.config import settings


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="admin_token")
def admin_token_fixture(client: TestClient, session: Session):
    admin = User(
        email="admin@rac.demo",
        password_hash="$2b$12$eImiTXuWVxfM37uY4JANjO5E.y5p/g5y3H1gE85R1S1S1S1S1S1S1",
        full_name="Dr. A. Rao",
        role=UserRole.admin,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    # Login to get real token
    from app.services.auth import create_access_token
    return create_access_token(admin)


@pytest.fixture(name="applicant_token")
def applicant_token_fixture(client: TestClient, session: Session):
    applicant = User(
        email="priya@example.com",
        password_hash="$2b$12$eImiTXuWVxfM37uY4JANjO5E.y5p/g5y3H1gE85R1S1S1S1S1S1S1",
        full_name="Priya Verma",
        role=UserRole.applicant,
    )
    session.add(applicant)
    session.commit()
    session.refresh(applicant)

    from app.services.auth import create_access_token
    return create_access_token(applicant)


def test_register_and_login(client: TestClient):
    # Short password -> 400
    res = client.post(
        "/api/auth/register",
        json={"email": "NewUser@Demo.com", "password": "short", "full_name": "New User"},
    )
    assert res.status_code == 400

    # Valid registration
    res = client.post(
        "/api/auth/register",
        json={"email": "NewUser@Demo.com", "password": "securepassword123", "full_name": "New User"},
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@demo.com"  # Stored lowercase
    assert data["user"]["role"] == "applicant"

    # Duplicate registration -> 409
    res = client.post(
        "/api/auth/register",
        json={"email": "newuser@demo.com", "password": "securepassword123", "full_name": "New User"},
    )
    assert res.status_code == 409

    # Case-insensitive login
    res = client.post(
        "/api/auth/login",
        json={"email": "NEWUSER@DEMO.COM", "password": "securepassword123"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]

    # /api/auth/me check
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "newuser@demo.com"


def test_role_permissions(client: TestClient, applicant_token: str, admin_token: str):
    # Applicant creating post -> 403
    res = client.post(
        "/api/posts",
        json={
            "advt_no": "RAC/2026/99",
            "title": "Forbidden Post",
            "discipline": "Electronics & Communication",
            "grade": "C",
            "closing_date": "2026-12-31T23:59:59Z",
            "summary": "Forbidden",
        },
        headers={"Authorization": f"Bearer {applicant_token}"},
    )
    assert res.status_code == 403

    # Admin creating post -> 201
    res = client.post(
        "/api/posts",
        json={
            "advt_no": "RAC/2026/01",
            "title": "Scientist 'C' – Radar",
            "discipline": "Electronics & Communication",
            "grade": "C",
            "closing_date": "2026-12-31T23:59:59Z",
            "summary": "Radar signal processing specialist",
            "requirements": [
                {"text": "Radar signal processing degree", "kind": "essential"},
                {"text": "FPGA experience", "kind": "desirable"},
            ],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["advt_no"] == "RAC/2026/01"
    assert len(data["requirements"]) == 2
    assert data["requirements"][0]["code"] == "E1"
    assert data["requirements"][1]["code"] == "D1"
    assert data["weights"] == {"knowledge": 60, "managerial": 20, "communication": 20}


def test_publish_post_rules(client: TestClient, admin_token: str):
    # Create draft without essential requirements
    res = client.post(
        "/api/posts",
        json={
            "advt_no": "RAC/2026/02",
            "title": "Scientist 'B' – Draft",
            "discipline": "Electrical",
            "grade": "B",
            "closing_date": "2026-12-31T23:59:59Z",
            "summary": "Draft summary",
            "requirements": [{"text": "Desirable only", "kind": "desirable"}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    post_id = res.json()["id"]

    # Publish without essential requirement -> 400
    res = client.post(f"/api/posts/{post_id}/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400
    assert "at least 1 essential requirement" in res.json()["detail"]

    # Update with essential requirement but past closing date (Asia/Kolkata)
    past_date = (datetime.now(ZoneInfo("Asia/Kolkata")) - timedelta(days=2)).isoformat()
    client.patch(
        f"/api/posts/{post_id}",
        json={
            "closing_date": past_date,
            "requirements": [{"text": "Essential degree", "kind": "essential"}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Publish with past closing date -> 400
    res = client.post(f"/api/posts/{post_id}/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400
    assert "Closing date must be today or in the future" in res.json()["detail"]

    # Update to valid future date & publish -> 200
    future_date = (datetime.now(ZoneInfo("Asia/Kolkata")) + timedelta(days=30)).isoformat()
    client.patch(
        f"/api/posts/{post_id}",
        json={"closing_date": future_date},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    res = client.post(f"/api/posts/{post_id}/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "published"

    # Edit published post -> 400
    res = client.patch(
        f"/api/posts/{post_id}",
        json={"title": "Updated Title"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400


def test_open_posts_and_summary(client: TestClient, admin_token: str):
    future_date = (datetime.now(ZoneInfo("Asia/Kolkata")) + timedelta(days=10)).isoformat()

    # Create & publish post 1
    p1 = client.post(
        "/api/posts",
        json={
            "advt_no": "RAC/2026/10",
            "title": "Open Post 1",
            "discipline": "Mechanical",
            "grade": "C",
            "closing_date": future_date,
            "summary": "Open post 1",
            "requirements": [{"text": "Essential M.Tech", "kind": "essential"}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()

    client.post(f"/api/posts/{p1['id']}/publish", headers={"Authorization": f"Bearer {admin_token}"})

    # Create draft post 2 (not published)
    client.post(
        "/api/posts",
        json={
            "advt_no": "RAC/2026/11",
            "title": "Draft Post 2",
            "discipline": "Civil",
            "grade": "D",
            "closing_date": future_date,
            "summary": "Draft post 2",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # GET /api/open-posts should list only published post 1
    res = client.get("/api/open-posts")
    assert res.status_code == 200
    open_list = res.json()
    assert len(open_list) == 1
    assert open_list[0]["advt_no"] == "RAC/2026/10"

    # GET /api/admin/summary
    res = client.get("/api/admin/summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    summary = res.json()
    assert summary["published"] >= 1
    assert summary["drafts"] >= 1
    assert summary["applications"] == 0
