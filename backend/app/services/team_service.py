from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.domain import permissions
from app.domain.enums import AssignableRole, Plan, PromptCategory, Role
from app.domain.plans import TEAM_SEAT_CREDITS, TEAM_SEATS
from app.models import Team, TeamInvite, TeamMember, TeamPrompt, User
from app.repositories.documents import DocumentRepository
from app.repositories.teams import TeamRepository
from app.repositories.users import CreditRepository
from app.schemas import teams as dto
from app.services.access_service import AccessService
from app.services.credit_service import CreditService
from app.utils.time import utcnow


class TeamService:
    def __init__(
        self,
        db: Session,
        teams: TeamRepository,
        documents: DocumentRepository,
        credit_log: CreditRepository,
        credits: CreditService,
        access: AccessService,
    ):
        self.db = db
        self.teams = teams
        self.documents = documents
        self.credit_log = credit_log
        self.credits = credits
        self.access = access

    # -- workspace ---------------------------------------------------------------
    def my_team(self, user: User) -> dto.MyTeamResponse:
        team_view = None
        member = self.access.membership(user)
        if member:
            team = self.teams.get(member.team_id)
            role = Role(member.role)
            team_view = dto.TeamResponse(
                id=team.id, name=team.name, role=role, seats=TEAM_SEATS,
                members=[
                    dto.MemberResponse(user_id=m.user_id, name=m.user.name, email=m.user.email, role=Role(m.role))
                    for m in self.teams.members(team.id)
                ],
                invites=[
                    dto.InviteResponse(id=i.id, email=i.email, role=Role(i.role))
                    for i in self.teams.invites(team.id)
                ] if permissions.can_manage_team(role) else [],
            )
        pending = [
            dto.PendingInviteResponse(id=i.id, team_name=i.team.name, role=Role(i.role))
            for i in self.teams.invites_for_email(user.email)
        ]
        return dto.MyTeamResponse(team=team_view, pending_invites=pending)

    def create(self, user: User, name: str) -> Team:
        if user.plan != Plan.TEAM.value:
            raise PermissionDeniedError("Upgrade to the Team plan to create a workspace")
        if self.access.membership(user):
            raise BadRequestError("You are already in a team")
        team = self.teams.add_team(Team(name=name, owner_id=user.id, created_at=utcnow()))
        self.teams.add_member(TeamMember(team_id=team.id, user_id=user.id, role=Role.OWNER.value))
        self.db.commit()
        return team

    # -- invites -------------------------------------------------------------------
    def invite(self, user: User, team_id: int, email: str, role: AssignableRole) -> TeamInvite:
        email = email.strip().lower()  # invites are matched to accounts by lower-cased email
        actor = self.access.require_team_member(user, team_id, manage=True)
        if not permissions.can_assign_role(Role(actor.role), Role(role.value)):
            raise BadRequestError("Invalid role")
        if self.teams.seats_used(team_id) >= TEAM_SEATS:
            raise BadRequestError(f"All {TEAM_SEATS} seats are in use")
        if self.teams.member_with_email(team_id, email) or self.teams.find_invite(team_id, email):
            raise BadRequestError("Already a member or invited")
        invite = self.teams.add_invite(
            TeamInvite(team_id=team_id, email=email, role=role.value, created_at=utcnow()))
        self.db.commit()
        return invite

    def accept_invite(self, user: User, invite_id: int) -> None:
        invite = self.teams.get_invite(invite_id)
        if not invite or invite.email != user.email.lower():
            raise NotFoundError("Invite not found")
        if self.access.membership(user):
            raise BadRequestError("Leave your current team before joining another")
        self.teams.add_member(TeamMember(team_id=invite.team_id, user_id=user.id, role=invite.role))
        self.teams.remove_invite(invite)
        self.credits.add_credits(user, TEAM_SEAT_CREDITS, "team_seat")  # commits

    def cancel_invite(self, user: User, invite_id: int) -> None:
        """The invitee declines, or an owner/admin revokes."""
        invite = self.teams.get_invite(invite_id)
        if not invite:
            raise NotFoundError("Invite not found")
        if invite.email != user.email.lower():
            self.access.require_team_member(user, invite.team_id, manage=True)
        self.teams.remove_invite(invite)
        self.db.commit()

    # -- members ---------------------------------------------------------------------
    def change_role(self, user: User, team_id: int, member_id: int, role: AssignableRole) -> TeamMember:
        actor = self.access.require_team_member(user, team_id, manage=True)
        target = self._target(actor, team_id, member_id)
        if not permissions.can_assign_role(Role(actor.role), Role(role.value)):
            raise BadRequestError("Invalid role")
        target.role = role.value
        self.db.commit()
        return target

    def remove_member(self, user: User, team_id: int, member_id: int) -> None:
        """Owners/admins remove members; any non-owner may remove themself (leave)."""
        actor = self.access.require_team_member(user, team_id)
        if member_id == user.id:
            if actor.role == Role.OWNER.value:
                raise BadRequestError("The owner can't leave the team")
            target = actor
        else:
            if not permissions.can_manage_team(Role(actor.role)):
                raise PermissionDeniedError("Only owners and admins can do this")
            target = self._target(actor, team_id, member_id)
        self.teams.remove_member(target)
        self.db.commit()

    def _target(self, actor: TeamMember, team_id: int, member_id: int) -> TeamMember:
        target = self.teams.get_member(team_id, member_id)
        if not target:
            raise NotFoundError("Member not found")
        if not permissions.can_change_member(Role(actor.role), Role(target.role)):
            raise PermissionDeniedError("You can't change this member")
        return target

    def usage(self, user: User, team_id: int) -> dto.UsageResponse:
        self.access.require_team_member(user, team_id, manage=True)
        rows = []
        for m in self.teams.members(team_id):
            last = self.credit_log.last_activity(m.user_id)
            rows.append(dto.MemberUsageResponse(
                user_id=m.user_id, name=m.user.name, email=m.user.email, role=Role(m.role),
                credits_used=self.credit_log.spent(m.user_id),
                docs_uploaded=self.documents.count_shared_by(team_id, m.user_id),
                last_active=last.isoformat() if last else None,
            ))
        return dto.UsageResponse(members=rows)

    # -- shared prompts ----------------------------------------------------------------
    def list_prompts(self, user: User, team_id: int) -> list[TeamPrompt]:
        self.access.require_team_member(user, team_id)
        return self.teams.prompts(team_id)

    def add_prompt(self, user: User, team_id: int, title: str, prompt: str, category: PromptCategory) -> TeamPrompt:
        self.access.require_team_member(user, team_id, manage=True)
        created = self.teams.add_prompt(TeamPrompt(
            team_id=team_id, title=title, prompt=prompt, category=category.value, created_at=utcnow()))
        self.db.commit()
        return created

    def delete_prompt(self, user: User, team_id: int, prompt_id: int) -> None:
        self.access.require_team_member(user, team_id, manage=True)
        prompt = self.teams.get_prompt(team_id, prompt_id)
        if not prompt:
            raise NotFoundError("Prompt not found")
        self.teams.remove_prompt(prompt)
        self.db.commit()
