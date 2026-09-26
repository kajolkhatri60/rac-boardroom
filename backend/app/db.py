import sqlite3
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import SQLModel, Session, create_engine

from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a DB session for HTTP request handlers."""
    with Session(engine) as session:
        yield session


@contextmanager
def session_ctx():
    """
    Context manager for short-lived DB sessions used in WebSocket handlers
    and background tasks where FastAPI DI is not available.

    Reads the module-level ``engine`` at call time, so patching
    ``app.db.engine`` in tests affects both this and ``get_session``.
    """
    with Session(engine) as session:
        yield session
