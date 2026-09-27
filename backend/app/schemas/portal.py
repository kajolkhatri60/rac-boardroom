from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.portal import Grade, InterviewType, PostStatus, RequirementKind, UserRole


# --- Auth Schemas ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    discipline: Optional[str] = None
    specialisation: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Post & Requirement Schemas ---

class RequirementInput(BaseModel):
    text: str
    kind: RequirementKind = RequirementKind.essential


class RequirementResponse(BaseModel):
    id: int
    post_id: int
    code: str
    text: str
    kind: str
    position: int


class PostCreateRequest(BaseModel):
    advt_no: str
    title: str
    discipline: str
    grade: Grade
    interview_type: InterviewType = InterviewType.recruitment
    vacancies: int = 1
    closing_date: datetime
    summary: str
    requirements: List[RequirementInput] = []


class PostUpdateRequest(BaseModel):
    advt_no: Optional[str] = None
    title: Optional[str] = None
    discipline: Optional[str] = None
    grade: Optional[Grade] = None
    interview_type: Optional[InterviewType] = None
    vacancies: Optional[int] = None
    closing_date: Optional[datetime] = None
    summary: Optional[str] = None
    requirements: Optional[List[RequirementInput]] = None


class PostResponse(BaseModel):
    id: int
    advt_no: str
    title: str
    discipline: str
    grade: str
    interview_type: str
    vacancies: int
    closing_date: datetime
    summary: str
    status: str
    weights: Optional[Any] = None
    created_by_id: int
    created_at: datetime
    published_at: Optional[datetime] = None
    requirements: List[RequirementResponse] = []


# --- Admin Summary Schema ---

class AdminSummaryResponse(BaseModel):
    drafts: int
    published: int
    closed: int
    applications: int = 0
