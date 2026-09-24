from fastapi import APIRouter

from app.api.deps import CommentsDep, CurrentUser, TeamsDep
from app.schemas import teams as dto
from app.schemas.common import MessageOut

router = APIRouter(tags=["teams"])


def _comment(c) -> dto.CommentResponse:
    return dto.CommentResponse(
        id=c.id, user_name=c.user.name, content=c.content, page=c.page,
        resolved=c.resolved, created_at=c.created_at.isoformat())


@router.get("/teams/me", response_model=dto.MyTeamResponse)
def my_team(user: CurrentUser, teams: TeamsDep):
    """The current user's team (or null) plus invites addressed to their email."""
    return teams.my_team(user)


@router.post("/teams", response_model=dto.CreatedTeamResponse)
def create_team(body: dto.TeamCreate, user: CurrentUser, teams: TeamsDep):
    return teams.create(user, body.name)


@router.post("/teams/{team_id}/invite", response_model=dto.InviteResponse)
def invite(team_id: int, body: dto.TeamInviteRequest, user: CurrentUser, teams: TeamsDep):
    return teams.invite(user, team_id, body.email, body.role)


@router.post("/teams/invites/{invite_id}/accept", response_model=MessageOut)
def accept_invite(invite_id: int, user: CurrentUser, teams: TeamsDep):
    teams.accept_invite(user, invite_id)
    return {"message": "Joined team"}


@router.delete("/teams/invites/{invite_id}", response_model=MessageOut)
def cancel_invite(invite_id: int, user: CurrentUser, teams: TeamsDep):
    teams.cancel_invite(user, invite_id)
    return {"message": "Invite removed"}


@router.patch("/teams/{team_id}/members/{member_id}", response_model=dto.RoleChangedResponse)
def change_role(team_id: int, member_id: int, body: dto.RoleUpdate, user: CurrentUser, teams: TeamsDep):
    member = teams.change_role(user, team_id, member_id, body.role)
    return dto.RoleChangedResponse(user_id=member.user_id, role=member.role)


@router.delete("/teams/{team_id}/members/{member_id}", response_model=MessageOut)
def remove_member(team_id: int, member_id: int, user: CurrentUser, teams: TeamsDep):
    teams.remove_member(user, team_id, member_id)
    return {"message": "Member removed"}


@router.get("/teams/{team_id}/usage", response_model=dto.UsageResponse)
def usage(team_id: int, user: CurrentUser, teams: TeamsDep):
    return teams.usage(user, team_id)


@router.get("/teams/{team_id}/prompts", response_model=list[dto.PromptResponse])
def list_prompts(team_id: int, user: CurrentUser, teams: TeamsDep):
    return teams.list_prompts(user, team_id)


@router.post("/teams/{team_id}/prompts", response_model=dto.PromptResponse)
def add_prompt(team_id: int, body: dto.PromptCreate, user: CurrentUser, teams: TeamsDep):
    return teams.add_prompt(user, team_id, body.title, body.prompt, body.category)


@router.delete("/teams/{team_id}/prompts/{prompt_id}", response_model=MessageOut)
def delete_prompt(team_id: int, prompt_id: int, user: CurrentUser, teams: TeamsDep):
    teams.delete_prompt(user, team_id, prompt_id)
    return {"message": "Prompt deleted"}


# -- document comments ---------------------------------------------------------------------
@router.get("/documents/{document_id}/comments", response_model=list[dto.CommentResponse])
def list_comments(document_id: int, user: CurrentUser, comments: CommentsDep):
    return [_comment(c) for c in comments.list_for(user, document_id)]


@router.post("/documents/{document_id}/comments", response_model=dto.CommentResponse)
def add_comment(document_id: int, body: dto.CommentCreate, user: CurrentUser, comments: CommentsDep):
    return _comment(comments.add(user, document_id, body.content, body.page))


@router.patch("/comments/{comment_id}/resolve", response_model=dto.CommentResponse)
def toggle_resolved(comment_id: int, user: CurrentUser, comments: CommentsDep):
    return _comment(comments.toggle_resolved(user, comment_id))
