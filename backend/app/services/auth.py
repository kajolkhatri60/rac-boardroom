from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.models.portal import User, UserRole, AuditEvent

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value if isinstance(user.role, UserRole) else str(user.role),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_session),
) -> User:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(auth.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role
        if isinstance(user_role, str):
            user_role = UserRole(user_role)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: insufficient role permissions",
            )
        return current_user

    return role_checker


def write_audit(
    db: Session,
    actor_id: Optional[int],
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    detail: Optional[dict] = None,
) -> AuditEvent:
    event = AuditEvent(
        actor_id=actor_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        detail=detail,
        at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
