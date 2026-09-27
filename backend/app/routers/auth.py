from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models.portal import User, UserRole
from app.schemas.portal import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
)
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_session)):
    clean_email = req.email.lower().strip()
    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required.",
        )

    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    # Check duplicate
    existing = db.exec(select(User).where(User.email == clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=clean_email,
        password_hash=hash_password(req.password),
        full_name=req.full_name.strip(),
        role=UserRole.applicant,  # Always applicant on self-register
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    user_res = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if isinstance(user.role, UserRole) else str(user.role),
        discipline=user.discipline,
        specialisation=user.specialisation,
        employee_id=user.employee_id,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_res)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_session)):
    clean_email = req.email.lower().strip()
    user = db.exec(select(User).where(User.email == clean_email)).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated.",
        )

    token = create_access_token(user)
    user_res = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if isinstance(user.role, UserRole) else str(user.role),
        discipline=user.discipline,
        specialisation=user.specialisation,
        employee_id=user.employee_id,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_res)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role),
        discipline=current_user.discipline,
        specialisation=current_user.specialisation,
        employee_id=current_user.employee_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )
