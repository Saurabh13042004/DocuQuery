from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class DocumentCreate(BaseModel):
    filename: str
    file_path: str


class QuestionRequest(BaseModel):
    question: str
    id: int


class MessageBase(BaseModel):
    content: str
    is_user: bool


class MessageCreate(MessageBase):
    pass


class Message(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    timestamp: datetime


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_path: str
    upload_date: datetime
    team_id: Optional[int] = None
    messages: List[Message] = []


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class MessageOut(BaseModel):
    message: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime
    credits: int
    plan: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class UpgradePlanRequest(BaseModel):
    plan: str


class CreditTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: int
    reason: str
    created_at: datetime


class PlanFeature(BaseModel):
    name: str
    price_usd: int
    monthly_credits: int
    description: str
    features: List[str]
    badge_color: str


class PlansResponse(BaseModel):
    plans: dict
    current_plan: str
    credits: int


class TeamCreate(BaseModel):
    name: str


class TeamInviteRequest(BaseModel):
    email: str
    role: str = "editor"


class RoleUpdate(BaseModel):
    role: str


class PromptCreate(BaseModel):
    title: str
    prompt: str
    category: str = "General"


class CommentCreate(BaseModel):
    content: str
    page: Optional[int] = None
