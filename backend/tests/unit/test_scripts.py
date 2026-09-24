"""The ops scripts are plain functions over a session and the ports, so they are testable like the rest."""
from app.models import Document
from scripts.migrate_files_to_blob import migrate
from scripts.reindex_documents import reindex_all
from scripts.set_user_plan import set_plan
from tests.factories import make_user
from tests.helpers import make_pdf


def lines():
    out = []
    return out, out.append


def test_set_plan_is_a_dry_run_unless_applied(svc, db):
    user = make_user(svc, credits=527)
    out, log = lines()
    assert set_plan(db, user.email, "starter", apply=False, log=log) == 0
    db.refresh(user)
    assert user.plan == "free" and any("Dry run" in l for l in out)


def test_set_plan_changes_only_the_plan_and_leaves_a_trail(svc, db):
    user = make_user(svc, credits=527)
    assert set_plan(db, user.email.upper(), "Starter", apply=True, log=lambda _: None) == 0
    db.refresh(user)
    assert (user.plan, user.credits) == ("starter", 527)
    assert {t.reason: t.amount for t in svc.credits.history(user)}["plan_set_starter"] == 0


def test_set_plan_reports_unknown_users_plans_and_no_ops(svc, db):
    user = make_user(svc)
    assert set_plan(db, "ghost@example.com", "pro", True, log=lambda _: None) == 1
    assert set_plan(db, user.email, "gold", True, log=lambda _: None) == 2
    assert set_plan(db, user.email, "free", True, log=lambda _: None) == 0
    assert svc.credits.history(user)[0].reason == "signup_bonus"          # the no-op wrote nothing


async def test_migrate_moves_local_files_to_storage_only_when_applied(db, fakes, tmp_path, svc):
    user = make_user(svc)
    local = tmp_path / "old.pdf"
    local.write_bytes(make_pdf("legacy"))
    db.add_all([
        Document(filename="old.pdf", file_path=str(local), user_id=user.id),
        Document(filename="gone.pdf", file_path=str(tmp_path / "missing.pdf"), user_id=user.id),
        Document(filename="new.pdf", file_path="docs/already.pdf", user_id=user.id),
        Document(filename="s3.pdf", file_path="https://bucket.s3.amazonaws.com/x.pdf", user_id=user.id),
    ])
    db.commit()

    assert await migrate(db, fakes.storage, apply=False, log=lambda _: None) == (1, 1)
    assert fakes.storage.files == {}                                     # dry run touched nothing
    assert await migrate(db, fakes.storage, apply=True, log=lambda _: None) == (1, 1)

    moved = db.query(Document).filter(Document.filename == "old.pdf").one()
    assert moved.file_path.startswith("docs/") and fakes.storage.files[moved.file_path] == local.read_bytes()
    assert db.query(Document).filter(Document.filename == "s3.pdf").one().file_path.startswith("https://")


async def test_reindex_rebuilds_every_document_and_survives_a_bad_one(svc, db, fakes):
    user = make_user(svc, credits=20)
    good = await svc.documents.upload(user, "good.pdf", make_pdf("alpha beta gamma"), shared=False)
    db.add(Document(filename="lost.pdf", file_path="docs/lost.pdf", user_id=user.id))
    db.commit()
    fakes.vectors.records.clear()

    out, log = lines()
    assert await reindex_all(db, fakes.storage, svc.indexer, log=log) == (1, 1)
    assert len(fakes.vectors.for_document(good.id)) == 1 and any("FAILED" in l for l in out)
