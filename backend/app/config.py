import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

# Resolve backend directory and load .env if present
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)


def _get_bool(key: str, default: bool) -> bool:
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in ("true", "1", "yes", "on")


def _get_int(key: str, default: int) -> int:
    val = os.getenv(key)
    if val is None or not val.strip().isdigit():
        return default
    return int(val.strip())


@dataclass
class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "dev")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./rac.db")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "")
    DEMO_MODE: bool = _get_bool("DEMO_MODE", True)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_EXPIRE_HOURS: int = _get_int("JWT_EXPIRE_HOURS", 12)
    DEMO_PASSWORD: str = os.getenv("DEMO_PASSWORD", "")


settings = Settings()


def validate_config():
    """Verify essential configuration at server startup."""
    if not settings.JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not set in backend/.env")
