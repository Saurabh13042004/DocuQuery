from __future__ import annotations

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain import permissions
from app.domain.enums import Role
from app.models import Document, TeamMember, User
from app.repositories.documents import DocumentRepository
from app.repositories.teams import TeamRepository


class AccessService:
    """Answers "may this user touch that?" for documents and teams."""

    def __init__(self, documents: DocumentRepository, teams: TeamRepository):
        self.documents = documents
        self.teams = teams

    def membership(self, user: User) -> TeamMember | None:
        return self.teams.membership_of(user.id)

    def get_document(self, user: User, document_id: int) -> tuple[Document, Role]:
        """The document and the role the user has on it, or 404 (never reveal that it exists).

        Personal documents: the uploader, as OWNER. Shared documents: members of that team, with
        their team role.
        """
        document = self.documents.get(document_id)
        if document and document.team_id:
            member = self.membership(user)
            if member and member.team_id == document.team_id:
                return document, Role(member.role)
        elif document and document.user_id == user.id:
            return document, Role.OWNER
        raise NotFoundError("Document not found")

    def require_team_member(self, user: User, team_id: int, *, manage: bool = False) -> TeamMember:
        member = self.membership(user)
        if not member or member.team_id != team_id:
            raise NotFoundError("Team not found")
        if manage and not permissions.can_manage_team(Role(member.role)):
            raise PermissionDeniedError("Only owners and admins can do this")
        return member
