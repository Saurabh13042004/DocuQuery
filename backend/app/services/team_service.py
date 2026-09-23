from fastapi import HTTPException
from sqlalchemy.orm import Session
from .. import models

SEATS = 5
SEAT_CREDITS = 1500
ASSIGNABLE_ROLES = ("admin", "editor", "viewer")
CAN_EDIT = ("owner", "admin", "editor")     # upload / edit PDF
CAN_MANAGE = ("owner", "admin")             # members, prompts, usage, delete any team doc


def get_membership(db: Session, user: models.User) -> models.TeamMember | None:
    return db.query(models.TeamMember).filter(models.TeamMember.user_id == user.id).first()


def require_member(db: Session, user: models.User, team_id: int, manage: bool = False) -> models.TeamMember:
    member = get_membership(db, user)
    if not member or member.team_id != team_id:
        raise HTTPException(status_code=404, detail="Team not found")
    if manage and member.role not in CAN_MANAGE:
        raise HTTPException(status_code=403, detail="Only owners and admins can do this")
    return member


def get_document(db: Session, user: models.User, document_id: int) -> tuple[models.Document, str]:
    """Return (document, role) if *user* may access it, else 404.

    Personal docs → uploader with role "owner". Shared docs → members of the team, with their team role.
    """
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if doc and doc.team_id:
        member = get_membership(db, user)
        if member and member.team_id == doc.team_id:
            return doc, member.role
    elif doc and doc.user_id == user.id:
        return doc, "owner"
    raise HTTPException(status_code=404, detail="Document not found")


def can_delete(doc: models.Document, user: models.User, role: str) -> bool:
    return role in CAN_MANAGE or (role == "editor" and doc.user_id == user.id)


def seats_used(db: Session, team_id: int) -> int:
    members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).count()
    invites = db.query(models.TeamInvite).filter(models.TeamInvite.team_id == team_id).count()
    return members + invites
