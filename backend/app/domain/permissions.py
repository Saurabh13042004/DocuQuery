"""Who may do what. Pure functions over roles, so the rules are easy to read and to test.

A ``None`` role means "not acting through a team" (the user's own personal documents), which
is always allowed. Personal documents are treated as ``Role.OWNER`` by the access service.
"""
from __future__ import annotations

from app.domain.enums import Role

EDITORS = frozenset({Role.OWNER, Role.ADMIN, Role.EDITOR})
MANAGERS = frozenset({Role.OWNER, Role.ADMIN})


def can_upload(role: Role | None) -> bool:
    return role is None or role in EDITORS


def can_edit_pdf(role: Role) -> bool:
    return role in EDITORS


def can_manage_team(role: Role) -> bool:
    return role in MANAGERS


def can_delete_document(role: Role, *, is_uploader: bool) -> bool:
    return role in MANAGERS or (role is Role.EDITOR and is_uploader)


def can_change_member(actor: Role, target: Role) -> bool:
    """Owners can't be changed; admins can only manage editors and viewers."""
    if target is Role.OWNER:
        return False
    return actor is Role.OWNER or (actor is Role.ADMIN and target is not Role.ADMIN)


def can_assign_role(actor: Role, new_role: Role) -> bool:
    """Only the owner can create admins; nobody can hand out ownership."""
    if new_role is Role.OWNER:
        return False
    return new_role is not Role.ADMIN or actor is Role.OWNER
