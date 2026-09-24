import dataclasses

import pytest

from app.core.exceptions import (
    BadRequestError, ExternalServiceError, InsufficientCreditsError, NotFoundError, PayloadTooLargeError,
    PermissionDeniedError,
)
from app.models import Comment, Document, Message, TeamMember
from tests.factories import build_services, make_user
from tests.helpers import make_pdf

PDF = make_pdf("The notice period is thirty days.", "Salary is paid monthly.")


def join_team(svc, db, team, role):
    member = make_user(svc)
    db.add(TeamMember(team_id=team.id, user_id=member.id, role=role))
    db.commit()
    return member


@pytest.fixture
def team_env(svc, db):
    owner = make_user(svc, plan="team", credits=100)
    return owner, svc.teams.create(owner, "Acme")


# -- upload -------------------------------------------------------------------------------------
async def test_upload_stores_the_file_records_the_document_indexes_it_and_charges_two_credits(svc, fakes):
    user = make_user(svc, credits=10)
    doc = await svc.documents.upload(user, "Policy.pdf", PDF, shared=False)

    assert (doc.filename, doc.user_id, doc.team_id, doc.edited_file_path) == ("Policy.pdf", user.id, None, None)
    assert fakes.storage.files[doc.file_path] == PDF and doc.file_path.startswith("docs/")
    assert sorted(r.page for r in fakes.vectors.for_document(doc.id)) == [1, 2]
    assert user.credits == 8


async def test_upload_sanitises_the_filename(svc):
    doc = await svc.documents.upload(make_user(svc), "../../etc/passwd<>.pdf", PDF, shared=False)
    assert doc.filename == "passwd_.pdf"


@pytest.mark.parametrize("data,error,message", [
    (b"", BadRequestError, "empty"),
    (b"<html>hello</html>", BadRequestError, "Only PDF"),
    (b"%PDF-1.4 garbage that is not a real pdf", BadRequestError, "couldn't be read"),
])
async def test_bad_files_are_rejected_before_anything_is_stored_or_charged(svc, fakes, data, error, message):
    user = make_user(svc, credits=10)
    with pytest.raises(error, match=message):
        await svc.documents.upload(user, "x.pdf", data, shared=False)
    assert user.credits == 10 and fakes.storage.files == {} and fakes.vectors.records == {}


async def test_oversized_files_are_rejected(db, fakes, settings):
    svc = build_services(db, fakes, dataclasses.replace(settings, max_upload_mb=0))
    with pytest.raises(PayloadTooLargeError):
        await svc.documents.upload(make_user(svc), "x.pdf", PDF, shared=False)


async def test_not_enough_credits_stops_the_upload_with_nothing_stored(svc, fakes):
    user = make_user(svc, credits=1)
    with pytest.raises(InsufficientCreditsError):
        await svc.documents.upload(user, "x.pdf", PDF, shared=False)
    assert fakes.storage.files == {}


async def test_a_failure_while_indexing_removes_everything_and_refunds(svc, db, fakes):
    user = make_user(svc, credits=10)
    fakes.vectors.fail_upsert = RuntimeError("vector db down")
    with pytest.raises(ExternalServiceError, match="not charged"):
        await svc.documents.upload(user, "x.pdf", PDF, shared=False)
    assert db.query(Document).count() == 0 and fakes.storage.files == {}
    assert user.credits == 10
    assert [t.reason for t in svc.credits.history(user)][:2] == ["upload_refund", "upload"]


async def test_a_failure_while_storing_the_file_refunds_too(svc, db, fakes):
    user = make_user(svc, credits=10)
    fakes.storage.fail_put = OSError("bucket unavailable")
    with pytest.raises(ExternalServiceError):
        await svc.documents.upload(user, "x.pdf", PDF, shared=False)
    assert db.query(Document).count() == 0 and user.credits == 10


async def test_viewers_cannot_upload_and_sharing_needs_a_team(svc, db, team_env):
    _, team = team_env
    viewer = join_team(svc, db, team, "viewer")
    with pytest.raises(PermissionDeniedError, match="Viewers"):
        await svc.documents.upload(viewer, "x.pdf", PDF, shared=False)
    with pytest.raises(BadRequestError, match="Join a team"):
        await svc.documents.upload(make_user(svc), "x.pdf", PDF, shared=True)


async def test_team_members_can_share_or_keep_documents_private(svc, db, team_env):
    _, team = team_env
    editor = join_team(svc, db, team, "editor")
    shared = await svc.documents.upload(editor, "s.pdf", PDF, shared=True)
    private = await svc.documents.upload(editor, "p.pdf", PDF, shared=False)
    assert shared.team_id == team.id and private.team_id is None


# -- reading ------------------------------------------------------------------------------------
async def test_list_shows_personal_documents_plus_the_teams_shared_ones(svc, db, team_env):
    owner, team = team_env
    editor = join_team(svc, db, team, "editor")
    outsider = make_user(svc, credits=50)
    shared = await svc.documents.upload(owner, "shared.pdf", PDF, shared=True)
    mine = await svc.documents.upload(editor, "mine.pdf", PDF, shared=False)
    theirs = await svc.documents.upload(outsider, "theirs.pdf", PDF, shared=False)

    assert {d.id for d in svc.documents.list_for(editor)} == {shared.id, mine.id}
    assert {d.id for d in svc.documents.list_for(owner)} == {shared.id}
    assert {d.id for d in svc.documents.list_for(outsider)} == {theirs.id}


async def test_read_file_returns_the_original_or_the_latest_edit(svc, db, fakes):
    user = make_user(svc, credits=20)
    doc = await svc.documents.upload(user, "x.pdf", PDF, shared=False)
    assert await svc.documents.read_file(user, doc.id, edited=True) == PDF        # never edited: falls back
    fakes.storage.files["docs/edited_1.pdf"] = b"EDITED"
    doc.edited_file_path = "docs/edited_1.pdf"
    db.commit()
    assert await svc.documents.read_file(user, doc.id, edited=True) == b"EDITED"
    assert await svc.documents.read_file(user, doc.id, edited=False) == PDF


async def test_read_file_is_a_404_for_strangers_and_for_files_that_vanished(svc, db, fakes):
    user = make_user(svc, credits=20)
    doc = await svc.documents.upload(user, "x.pdf", PDF, shared=False)
    with pytest.raises(NotFoundError):
        await svc.documents.read_file(make_user(svc), doc.id, edited=False)
    fakes.storage.files.clear()
    with pytest.raises(NotFoundError, match="File not found"):
        await svc.documents.read_file(user, doc.id, edited=False)


# -- deleting -----------------------------------------------------------------------------------
async def test_delete_removes_the_row_files_vectors_history_messages_and_comments(svc, db, fakes):
    user = make_user(svc, credits=20)
    doc = await svc.documents.upload(user, "x.pdf", PDF, shared=False)
    doc_id, original = doc.id, doc.file_path
    fakes.storage.files["docs/edited_1.pdf"] = b"edited"
    doc.edited_file_path = "docs/edited_1.pdf"
    db.add_all([Message(document_id=doc_id, content="hi", is_user=True),
                Comment(document_id=doc_id, user_id=user.id, content="note")])
    db.commit()
    await fakes.memory.append(doc_id, "user", "hi")

    await svc.documents.delete(user, doc_id)

    assert db.query(Document).count() == db.query(Message).count() == db.query(Comment).count() == 0
    assert original not in fakes.storage.files and "docs/edited_1.pdf" not in fakes.storage.files
    assert fakes.vectors.for_document(doc_id) == [] and await fakes.memory.get(doc_id) == []


async def test_delete_leaves_legacy_files_alone_and_survives_cleanup_failures(svc, db, fakes):
    user = make_user(svc)
    doc = Document(filename="old.pdf", file_path="pdfs/old.pdf", user_id=user.id)
    db.add(doc)
    db.commit()

    async def boom(_):
        raise RuntimeError("redis down")

    fakes.memory.clear = boom
    await svc.documents.delete(user, doc.id)            # must not raise: the document is already gone
    assert db.query(Document).count() == 0


async def test_only_permitted_roles_may_delete_shared_documents(svc, db, team_env):
    owner, team = team_env
    admin, editor, other_editor, viewer = (join_team(svc, db, team, r) for r in ("admin", "editor", "editor", "viewer"))
    doc_of = lambda uploader: svc.documents.upload(uploader, "d.pdf", PDF, shared=True)          # noqa: E731

    mine = await doc_of(editor)
    for who in (viewer, other_editor):
        with pytest.raises(PermissionDeniedError):
            await svc.documents.delete(who, mine.id)
    await svc.documents.delete(editor, mine.id)                       # editors may delete their own

    theirs = await doc_of(other_editor)
    await svc.documents.delete(admin, theirs.id)                      # admins may delete anyone's
    await svc.documents.delete(owner, (await doc_of(editor)).id)      # so may owners
    with pytest.raises(NotFoundError):
        await svc.documents.delete(make_user(svc), mine.id)
