import os
import pytest
from app.config import settings

@pytest.fixture(autouse=True)
def setup_test_settings(monkeypatch):
    monkeypatch.setattr(settings, "JWT_SECRET", "test_jwt_secret_for_testing_123456789")
    monkeypatch.setattr(settings, "DEMO_PASSWORD", "test_demo_password_123")
    monkeypatch.setattr(settings, "DEMO_MODE", True)
