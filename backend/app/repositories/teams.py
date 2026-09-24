from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Team, TeamInvite, TeamMember, TeamPrompt, User


class TeamRepository:
    def __init__(self, db: Session):
        self.db = db

    # -- teams and members ---------------------------------------------------
    def get(self, team_id: int) -> Team | None:
        return self.db.get(Team, team_id)

    def add_team(self, team: Team) -> Team:
        self.db.add(team)
        self.db.flush()
        return team

    def membership_of(self, user_id: int) -> TeamMember | None:
        return self.db.query(TeamMember).filter(TeamMember.user_id == user_id).first()

    def get_member(self, team_id: int, user_id: int) -> TeamMember | None:
        return self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id, TeamMember.user_id == user_id).first()

    def member_with_email(self, team_id: int, email: str) -> TeamMember | None:
        return (
            self.db.query(TeamMember)
            .join(User, User.id == TeamMember.user_id)
            .filter(TeamMember.team_id == team_id, func.lower(User.email) == email.lower())
            .first()
        )

    def members(self, team_id: int) -> list[TeamMember]:
        return self.db.query(TeamMember).filter(TeamMember.team_id == team_id).all()

    def add_member(self, member: TeamMember) -> TeamMember:
        self.db.add(member)
        self.db.flush()
        return member

    def remove_member(self, member: TeamMember) -> None:
        self.db.delete(member)

    # -- invites ---------------------------------------------------------------
    def get_invite(self, invite_id: int) -> TeamInvite | None:
        return self.db.get(TeamInvite, invite_id)

    def find_invite(self, team_id: int, email: str) -> TeamInvite | None:
        return self.db.query(TeamInvite).filter(
            TeamInvite.team_id == team_id, TeamInvite.email == email).first()

    def invites(self, team_id: int) -> list[TeamInvite]:
        return self.db.query(TeamInvite).filter(TeamInvite.team_id == team_id).all()

    def invites_for_email(self, email: str) -> list[TeamInvite]:
        return self.db.query(TeamInvite).filter(TeamInvite.email == email.lower()).all()

    def add_invite(self, invite: TeamInvite) -> TeamInvite:
        self.db.add(invite)
        self.db.flush()
        return invite

    def remove_invite(self, invite: TeamInvite) -> None:
        self.db.delete(invite)

    def seats_used(self, team_id: int) -> int:
        """Members plus pending invites: an invite holds a seat until it is accepted or revoked."""
        return len(self.members(team_id)) + len(self.invites(team_id))

    # -- prompts ---------------------------------------------------------------
    def prompts(self, team_id: int) -> list[TeamPrompt]:
        return self.db.query(TeamPrompt).filter(
            TeamPrompt.team_id == team_id).order_by(TeamPrompt.id.desc()).all()

    def get_prompt(self, team_id: int, prompt_id: int) -> TeamPrompt | None:
        return self.db.query(TeamPrompt).filter(
            TeamPrompt.id == prompt_id, TeamPrompt.team_id == team_id).first()

    def add_prompt(self, prompt: TeamPrompt) -> TeamPrompt:
        self.db.add(prompt)
        self.db.flush()
        return prompt

    def remove_prompt(self, prompt: TeamPrompt) -> None:
        self.db.delete(prompt)
