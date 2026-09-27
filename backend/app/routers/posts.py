from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models.portal import (
    Post,
    PostRequirement,
    PostStatus,
    RequirementKind,
    User,
    UserRole,
    DEFAULT_GRADE_WEIGHTS,
)
from app.schemas.portal import (
    PostCreateRequest,
    PostUpdateRequest,
    PostResponse,
    RequirementResponse,
)
from app.services.auth import require_role, write_audit

router = APIRouter(prefix="/api/posts", tags=["admin-posts"])


def _assign_codes_and_save_requirements(
    db: Session, post_id: int, req_inputs: List
) -> List[PostRequirement]:
    # Delete existing requirements for this post
    existing_reqs = db.exec(
        select(PostRequirement).where(PostRequirement.post_id == post_id)
    ).all()
    for r in existing_reqs:
        db.delete(r)
    db.flush()

    e_count = 1
    d_count = 1
    created_reqs = []

    for pos, r_in in enumerate(req_inputs, start=1):
        kind = r_in.kind if hasattr(r_in, "kind") else r_in.get("kind", RequirementKind.essential)
        text = r_in.text if hasattr(r_in, "text") else r_in.get("text", "")
        if isinstance(kind, str):
            kind = RequirementKind(kind)

        if kind == RequirementKind.essential:
            code = f"E{e_count}"
            e_count += 1
        else:
            code = f"D{d_count}"
            d_count += 1

        req_obj = PostRequirement(
            post_id=post_id,
            code=code,
            text=text.strip(),
            kind=kind,
            position=pos,
        )
        db.add(req_obj)
        created_reqs.append(req_obj)

    db.flush()
    return created_reqs


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
def list_posts(
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    posts = db.exec(select(Post).order_by(Post.created_at.desc())).all()
    return [_build_post_response(db, p) for p in posts]


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    req: PostCreateRequest,
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    weights = DEFAULT_GRADE_WEIGHTS.get(req.grade, {"knowledge": 60, "managerial": 20, "communication": 20})

    post = Post(
        advt_no=req.advt_no.strip(),
        title=req.title.strip(),
        discipline=req.discipline.strip(),
        grade=req.grade,
        interview_type=req.interview_type,
        vacancies=req.vacancies,
        closing_date=req.closing_date,
        summary=req.summary.strip(),
        status=PostStatus.draft,
        weights=weights,
        created_by_id=admin.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Requirements saved in same request
    _assign_codes_and_save_requirements(db, post.id, req.requirements)
    db.commit()

    write_audit(
        db,
        actor_id=admin.id,
        action="post.created",
        entity="post",
        entity_id=str(post.id),
        detail={"advt_no": post.advt_no, "title": post.title},
    )

    return _build_post_response(db, post)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advertisement not found.",
        )
    return _build_post_response(db, post)


@router.patch("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    req: PostUpdateRequest,
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advertisement not found.",
        )

    if post.status != PostStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit published or closed advertisement.",
        )

    if req.advt_no is not None:
        post.advt_no = req.advt_no.strip()
    if req.title is not None:
        post.title = req.title.strip()
    if req.discipline is not None:
        post.discipline = req.discipline.strip()
    if req.grade is not None:
        post.grade = req.grade
        post.weights = DEFAULT_GRADE_WEIGHTS.get(req.grade, post.weights)
    if req.interview_type is not None:
        post.interview_type = req.interview_type
    if req.vacancies is not None:
        post.vacancies = req.vacancies
    if req.closing_date is not None:
        post.closing_date = req.closing_date
    if req.summary is not None:
        post.summary = req.summary.strip()

    db.add(post)
    db.flush()

    if req.requirements is not None:
        _assign_codes_and_save_requirements(db, post.id, req.requirements)

    db.commit()
    db.refresh(post)

    return _build_post_response(db, post)


@router.post("/{post_id}/publish", response_model=PostResponse)
def publish_post(
    post_id: int,
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advertisement not found.",
        )

    if post.status != PostStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft advertisements can be published.",
        )

    # Check essential requirement count >= 1
    essential_count = db.exec(
        select(PostRequirement).where(
            PostRequirement.post_id == post.id,
            PostRequirement.kind == RequirementKind.essential,
        )
    ).all()

    if len(essential_count) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Advertisement must contain at least 1 essential requirement to publish.",
        )

    # Check closing date in Asia/Kolkata timezone (User addition #4)
    kolkata_tz = ZoneInfo("Asia/Kolkata")
    today_kolkata = datetime.now(kolkata_tz).date()
    closing_date_kolkata = (
        post.closing_date.astimezone(kolkata_tz).date()
        if post.closing_date.tzinfo
        else post.closing_date.date()
    )

    if closing_date_kolkata < today_kolkata:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Closing date must be today or in the future.",
        )

    post.status = PostStatus.published
    post.published_at = datetime.now(timezone.utc)
    db.add(post)
    db.commit()
    db.refresh(post)

    write_audit(
        db,
        actor_id=admin.id,
        action="post.published",
        entity="post",
        entity_id=str(post.id),
        detail={"advt_no": post.advt_no, "title": post.title},
    )

    return _build_post_response(db, post)


@router.post("/{post_id}/close", response_model=PostResponse)
def close_post(
    post_id: int,
    db: Session = Depends(get_session),
    admin: User = Depends(require_role([UserRole.admin])),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advertisement not found.",
        )

    post.status = PostStatus.closed
    db.add(post)
    db.commit()
    db.refresh(post)

    write_audit(
        db,
        actor_id=admin.id,
        action="post.closed",
        entity="post",
        entity_id=str(post.id),
        detail={"advt_no": post.advt_no, "title": post.title},
    )

    return _build_post_response(db, post)
