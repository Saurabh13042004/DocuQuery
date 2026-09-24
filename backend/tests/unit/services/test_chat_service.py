import pytest

from app.core.exceptions import NotFoundError
from app.models import TeamMember
from app.rag.errors import LLMUnavailableError
from tests.factories import make_user
from tests.fakes import tool
from tests.helpers import make_pdf

PDF = make_pdf("Employee name: Ada Lovelace. The notice period is thirty days.")


async def upload(svc, user, shared=False):
    return await svc.documents.upload(user, "doc.pdf", PDF, shared=shared)


@pytest.fixture
async def ready(svc):
    user = make_user(svc, credits=50)
    return user, await upload(svc, user)


async def test_ask_answers_charges_one_credit_and_reports_the_balance(svc, ready, fakes):
    user, doc = ready
    before = user.credits
    fakes.llm.will_return(tool("answer_question", response="Thirty days (page 1)."))
    result = await svc.chat.ask(user, doc.id, "What is the notice period?")

    assert (result.answer, result.is_edit, result.edited_pdf_url) == ("Thirty days (page 1).", False, None)
    assert result.citations == ["1"] and result.credits_remaining == before - 1 == user.credits


async def test_an_unindexed_document_is_answered_from_its_own_text(svc, ready, fakes):
    user, doc = ready
    fakes.vectors.records.clear()                                     # e.g. indexing was skipped or the index was reset
    await svc.chat.ask(user, doc.id, "Who is the employee?")
    assert "Ada Lovelace" in fakes.llm.calls[0]["messages"][-1].content


async def test_an_edit_saves_a_new_version_replaces_the_previous_one_and_costs_three_credits_in_total(svc, ready, fakes, db):
    user, doc = ready
    before = user.credits
    fakes.llm.will_return(tool("edit_pdf", original_text="Ada", new_text="Grace"))
    first = await svc.chat.ask(user, doc.id, "Change Ada to Grace")

    assert first.is_edit and first.edited_pdf_url.startswith(f"/documents/{doc.id}/file?edited=true&v=")
    assert user.credits == before - 3                                 # 1 for the question + 2 for the edit
    db.refresh(doc)
    first_key = doc.edited_file_path
    assert first_key in fakes.storage.files and doc.file_path in fakes.storage.files

    fakes.llm.will_return(tool("edit_pdf", original_text="Grace", new_text="Alan"))
    await svc.chat.ask(user, doc.id, "Now Alan")
    db.refresh(doc)
    assert doc.edited_file_path != first_key and first_key not in fakes.storage.files    # superseded copy removed
    assert fakes.llm.calls[1]["messages"][-1].content.count("Grace") >= 1                # 2nd edit started from the 1st


async def test_a_viewer_gets_an_answer_but_cannot_edit_and_is_not_charged_for_an_edit(svc, db, fakes):
    owner = make_user(svc, plan="team", credits=50)
    team = svc.teams.create(owner, "Acme")
    viewer = make_user(svc, credits=10)
    db.add(TeamMember(team_id=team.id, user_id=viewer.id, role="viewer"))
    db.commit()
    doc = await upload(svc, owner, shared=True)

    fakes.llm.will_return(tool("edit_pdf", original_text="Ada", new_text="Eve"))
    result = await svc.chat.ask(viewer, doc.id, "change Ada to Eve")
    assert not result.is_edit and "view-only" in result.answer
    assert viewer.credits == 9 and doc.edited_file_path is None


async def test_a_user_with_exactly_one_credit_still_gets_their_edit(svc, ready, fakes, db):
    user, doc = ready
    user.credits = 1
    db.commit()
    fakes.llm.will_return(tool("edit_pdf", original_text="Ada", new_text="Grace"))
    result = await svc.chat.ask(user, doc.id, "edit")
    assert result.is_edit and user.credits == 0                       # the finished edit is not undone over the extra charge


async def test_a_failed_edit_attempt_costs_only_the_question(svc, ready, fakes, db):
    user, doc = ready
    before = user.credits
    fakes.llm.will_return(tool("edit_pdf", original_text="NOT IN THE DOCUMENT", new_text="x"))
    result = await svc.chat.ask(user, doc.id, "edit")
    assert not result.is_edit and "couldn't make that edit" in result.answer
    assert user.credits == before - 1 and doc.edited_file_path is None


async def test_provider_outages_are_not_charged(svc, ready, fakes):
    user, doc = ready
    before = user.credits
    fakes.llm.will_return(LLMUnavailableError("503"))
    result = await svc.chat.ask(user, doc.id, "hello")
    assert "high demand" in result.answer and user.credits == before


async def test_an_unexpected_crash_refunds_and_propagates(svc, ready, fakes):
    user, doc = ready
    before = user.credits
    fakes.llm.will_return(RuntimeError("bug"))
    with pytest.raises(RuntimeError):
        await svc.chat.ask(user, doc.id, "hello")
    assert user.credits == before


async def test_asking_about_someone_elses_document_is_a_404_and_free(svc, ready):
    _, doc = ready
    stranger = make_user(svc, credits=5)
    with pytest.raises(NotFoundError):
        await svc.chat.ask(stranger, doc.id, "hi")
    assert stranger.credits == 5


# -- history & export -----------------------------------------------------------------------
async def test_messages_are_stored_and_listed_in_order(svc, ready):
    user, doc = ready
    svc.chat.add_message(user, doc.id, "question", True)
    svc.chat.add_message(user, doc.id, "answer", False)
    messages = svc.chat.list_messages(user, doc.id)
    assert [(m.content, m.is_user) for m in messages] == [("question", True), ("answer", False)]
    assert all(m.timestamp for m in messages)


async def test_messages_and_exports_respect_document_access(svc, ready):
    _, doc = ready
    stranger = make_user(svc)
    for call in (lambda: svc.chat.add_message(stranger, doc.id, "x", True),
                 lambda: svc.chat.list_messages(stranger, doc.id),
                 lambda: svc.chat.export(stranger, doc.id, "md")):
        with pytest.raises(NotFoundError):
            call()


async def test_export_contains_the_conversation(svc, ready):
    user, doc = ready
    svc.chat.add_message(user, doc.id, "What is the notice period?", True)
    svc.chat.add_message(user, doc.id, "Thirty days.", False)
    export = svc.chat.export(user, doc.id, "md")
    assert export.filename == "chat_doc.md" and "What is the notice period?" in export.content and "Thirty days." in export.content
