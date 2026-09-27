from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models.portal import Post, PostRequirement, PostStatus, RequirementKind
from app.schemas.portal import PostResponse, RequirementResponse

router = APIRouter(prefix="/api/open-posts", tags=["open-posts"])


def _build_post_response(db: Session, post: Post) -> PostResponse:
    reqs = db.exec(
        select(PostRequirement)
        .where(PostRequirement.post_id == post.id)
        .order_by(PostRequirement.position)
    ).all()

    req_responses = [
        RequirementResponse(
            id=r.id,
            post_id=r.post_id,
            code=r.code,
            text=r.text,
            kind=r.kind.value if isinstance(r.kind, RequirementKind) else str(r.kind),
            position=r.position,
        )
        for r in reqs
    ]

    return PostResponse(
        id=post.id,
        advt_no=post.advt_no,
        title=post.title,
        discipline=post.discipline,
        grade=post.grade.value if hasattr(post.grade, "value") else str(post.grade),
        interview_type=post.interview_type.value if hasattr(post.interview_type, "value") else str(post.interview_type),
        vacancies=post.vacancies,
        closing_date=post.closing_date,
        summary=post.summary,
        status=post.status.value if hasattr(post.status, "value") else str(post.status),
        weights=post.weights,
        created_by_id=post.created_by_id,
        created_at=post.created_at,
        published_at=post.published_at,
        requirements=req_responses,
    )


@router.get("", response_model=List[PostResponse])
def list_open_posts(db: Session = Depends(get_session)):
    kolkata_tz = ZoneInfo("Asia/Kolkata")
    today_kolkata = datetime.now(kolkata_tz).date()

    all_published = db.exec(
        select(Post)
        .where(Post.status == PostStatus.published)
        .order_by(Post.published_at.desc())
    ).all()

    open_posts = []
    for post in all_published:
        closing_kolkata = (
            post.closing_date.astimezone(kolkata_tz).date()
            if post.closing_date.tzinfo
            else post.closing_date.date()
        )
        if closing_kolkata >= today_kolkata:
            open_posts.append(_build_post_response(db, post))

    return open_posts


@router.get("/{post_id}", response_model=PostResponse)
def get_open_post(post_id: int, db: Session = Depends(get_session)):
    post = db.get(Post, post_id)
    if not post or post.status != PostStatus.published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Open advertisement not found.",
        )
    return _build_post_response(db, post)
