from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlmodel import Session

from app.config import settings, validate_config
from app.db import create_db_and_tables, get_session
import app.models  # noqa: F401 — registers all SQLModel tables before create_all()
from app.routers import sessions, auth, posts, open_posts, admin_summary, dev
from app.routers import ws as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()
    create_db_and_tables()
    yield


app = FastAPI(
    title="RAC Boardroom Simulator API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check(session: Session = Depends(get_session)):
    try:
        session.exec(text("SELECT 1"))
        return {"status": "ok", "db": "ok", "env": settings.APP_ENV}
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "db": "error", "env": settings.APP_ENV},
        )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(open_posts.router)
app.include_router(admin_summary.router)
app.include_router(dev.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")

# WebSocket router mounts without prefix — full path is /ws/sessions/{room_code}
app.include_router(ws_router.router)
