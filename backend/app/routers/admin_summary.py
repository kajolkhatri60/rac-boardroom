from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.db import get_session
from app.models.portal import Post, PostStatus, User, UserRole
from app.schemas.portal import AdminSummaryResponse
from app.services.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["admin-summary"])


@router.get("/summary", response_model=AdminSummaryResponse)
def get_admin_summary(
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    drafts = db.exec(
        select(func.count(Post.id)).where(Post.status == PostStatus.draft)
    ).one() or 0

    published = db.exec(
        select(func.count(Post.id)).where(Post.status == PostStatus.published)
    ).one() or 0

    closed = db.exec(
        select(func.count(Post.id)).where(Post.status == PostStatus.closed)
    ).one() or 0

    return AdminSummaryResponse(
        drafts=drafts,
        published=published,
        closed=closed,
        applications=0,
    )
