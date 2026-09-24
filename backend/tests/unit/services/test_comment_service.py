import pytest

from app.core.exceptions import NotFoundError
from app.models import Document, TeamMember
from tests.factories import make_user


@pytest.fixture
def doc_and_owner(svc, db):
    owner = make_user(svc)
    doc = Document(filename="d.pdf", file_path="docs/d.pdf", user_id=owner.id)
    db.add(doc)
    db.commit()
    return doc, owner


def test_comments_are_added_listed_in_order_and_can_be_resolved_and_reopened(svc, doc_and_owner):
    doc, owner = doc_and_owner
    first = svc.comments.add(owner, doc.id, "Check page 2", 2)
    svc.comments.add(owner, doc.id, "Looks fine", None)
    assert [c.content for c in svc.comments.list_for(owner, doc.id)] == ["Check page 2", "Looks fine"]
    assert (first.page, first.resolved, first.user.name) == (2, False, "Test User")
    assert svc.comments.toggle_resolved(owner, first.id).resolved is True
    assert svc.comments.toggle_resolved(owner, first.id).resolved is False


def test_team_members_can_comment_on_shared_documents(svc, db):
    owner = make_user(svc, plan="team")
    team = svc.teams.create(owner, "Acme")
    viewer = make_user(svc)
    db.add(TeamMember(team_id=team.id, user_id=viewer.id, role="viewer"))
    doc = Document(filename="d.pdf", file_path="docs/d.pdf", user_id=owner.id, team_id=team.id)
    db.add(doc)
    db.commit()
    comment = svc.comments.add(viewer, doc.id, "Question about clause 4", 4)
    assert svc.comments.toggle_resolved(owner, comment.id).resolved


def test_strangers_cannot_list_add_or_resolve(svc, doc_and_owner):
    doc, owner = doc_and_owner
    stranger = make_user(svc)
    comment = svc.comments.add(owner, doc.id, "private", None)
    for call in (lambda: svc.comments.list_for(stranger, doc.id),
                 lambda: svc.comments.add(stranger, doc.id, "hi", None),
                 lambda: svc.comments.toggle_resolved(stranger, comment.id),
                 lambda: svc.comments.toggle_resolved(owner, 99999)):
        with pytest.raises(NotFoundError):
            call()
