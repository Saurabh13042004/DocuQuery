import pytest

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain.enums import Role
from app.models import Document, TeamMember
from tests.factories import make_user


def add_doc(db, user, team_id=None):
    doc = Document(filename="d.pdf", file_path="docs/d.pdf", user_id=user.id, team_id=team_id)
    db.add(doc)
    db.commit()
    return doc


def test_a_personal_document_is_only_visible_to_its_uploader(svc, db):
    owner, other = make_user(svc), make_user(svc)
    doc = add_doc(db, owner)
    assert svc.access.get_document(owner, doc.id) == (doc, Role.OWNER)
    with pytest.raises(NotFoundError):
        svc.access.get_document(other, doc.id)


def test_missing_documents_are_a_404_not_a_403(svc):
    with pytest.raises(NotFoundError, match="Document not found"):
        svc.access.get_document(make_user(svc), 999)


def test_team_members_reach_shared_documents_with_their_team_role(svc, db):
    owner = make_user(svc, plan="team")
    team = svc.teams.create(owner, "Acme")
    member = make_user(svc)
    db.add(TeamMember(team_id=team.id, user_id=member.id, role="viewer"))
    db.commit()
    doc = add_doc(db, owner, team_id=team.id)
    assert svc.access.get_document(member, doc.id)[1] is Role.VIEWER
    assert svc.access.get_document(owner, doc.id)[1] is Role.OWNER


def test_outsiders_and_former_members_lose_access_to_shared_documents(svc, db):
    owner = make_user(svc, plan="team")
    team = svc.teams.create(owner, "Acme")
    doc = add_doc(db, owner, team_id=team.id)
    with pytest.raises(NotFoundError):
        svc.access.get_document(make_user(svc), doc.id)


def test_a_shared_document_is_not_reachable_by_its_uploader_after_leaving_the_team(svc, db):
    owner = make_user(svc, plan="team")
    team = svc.teams.create(owner, "Acme")
    leaver = make_user(svc)
    db.add(TeamMember(team_id=team.id, user_id=leaver.id, role="editor"))
    db.commit()
    doc = add_doc(db, leaver, team_id=team.id)
    svc.teams.remove_member(leaver, team.id, leaver.id)
    with pytest.raises(NotFoundError):
        svc.access.get_document(leaver, doc.id)


def test_require_team_member_checks_membership_and_management(svc, db):
    owner = make_user(svc, plan="team")
    team = svc.teams.create(owner, "Acme")
    viewer = make_user(svc)
    db.add(TeamMember(team_id=team.id, user_id=viewer.id, role="viewer"))
    db.commit()
    assert svc.access.require_team_member(owner, team.id, manage=True).role == "owner"
    assert svc.access.require_team_member(viewer, team.id).role == "viewer"
    with pytest.raises(PermissionDeniedError):
        svc.access.require_team_member(viewer, team.id, manage=True)
    with pytest.raises(NotFoundError):
        svc.access.require_team_member(make_user(svc), team.id)
    with pytest.raises(NotFoundError):
        svc.access.require_team_member(owner, team.id + 100)
