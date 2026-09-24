from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import Email, ORMModel, Password, PersonName


class SignupRequest(BaseModel):
    name: PersonName
    email: Email
    password: Password


class LoginRequest(BaseModel):
    email: Email
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: Email


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=2048)
    password: Password


class UserResponse(ORMModel):
    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime
    credits: int
    plan: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

