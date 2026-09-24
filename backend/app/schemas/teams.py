from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.domain.enums import AssignableRole, PromptCategory, Role
from app.schemas.common import Email, ORMModel

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
PromptText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
CommentText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class TeamCreate(BaseModel):
    name: Title


class TeamInviteRequest(BaseModel):
    email: Email
    role: AssignableRole = AssignableRole.EDITOR


class RoleUpdate(BaseModel):
    role: AssignableRole


class PromptCreate(BaseModel):
    title: Title
    prompt: PromptText
    category: PromptCategory = PromptCategory.GENERAL


class PromptResponse(ORMModel):
    id: int
    title: str
    prompt: str
    category: str


class MemberResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: Role


class InviteResponse(BaseModel):
    id: int
    email: str
    role: Role


class TeamResponse(BaseModel):
    id: int
    name: str
    role: Role
    seats: int
    members: list[MemberResponse]
    invites: list[InviteResponse]


class PendingInviteResponse(BaseModel):
    id: int
    team_name: str
    role: Role


class MyTeamResponse(BaseModel):
    team: TeamResponse | None
    pending_invites: list[PendingInviteResponse]


class CreatedTeamResponse(BaseModel):
    id: int
    name: str


class RoleChangedResponse(BaseModel):
    user_id: int
    role: Role


class MemberUsageResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: Role
    credits_used: int
    docs_uploaded: int
    last_active: str | None


class UsageResponse(BaseModel):
    members: list[MemberUsageResponse]


class CommentCreate(BaseModel):
    content: CommentText
    page: int | None = Field(default=None, ge=1, le=100_000)


class CommentResponse(BaseModel):
    id: int
    user_name: str
    content: str
    page: int | None
    resolved: bool
    created_at: str
