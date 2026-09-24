import pytest

from app import container
from app.pdf.edit_service import EditOutcome
from app.rag.assistant import NO_ANSWER, OUT_OF_QUOTA, RATE_LIMITED, UNAVAILABLE, DocumentAssistant
from app.rag.errors import LLMQuotaError, LLMRateLimitError, LLMUnavailableError
from app.rag.tools import AnswerQuestionTool, EditPdfTool, SummarizeTool, ToolContext, ToolRegistry
from app.rag.types import LLMResponse
from tests.fakes import Fakes, tool
from tests.helpers import make_pdf

CTX = ToolContext(document_id=1, file_path="docs/x.pdf", allow_edit=True)


class StubEditor:
    def __init__(self, outcome: EditOutcome):
        self.outcome, self.calls = outcome, []

    async def edit(self, path, original, new):
        self.calls.append((path, original, new))
        return self.outcome


# -- individual tools ----------------------------------------------------------------------
async def test_answer_tool_returns_the_answer_with_page_citations():
    result = await AnswerQuestionTool().run(ToolContext(1, "p", source_pages=[2, 5]), {"response": "30 days"})
    assert (result.answer, result.citations, result.is_edit, result.remember) == ("30 days", ["2", "5"], False, True)


async def test_summarize_tool_reads_the_summary_argument():
    assert (await SummarizeTool().run(CTX, {"summary": "Short."})).answer == "Short."


async def test_edit_tool_refuses_when_the_user_only_has_view_access():
    editor = StubEditor(EditOutcome(True, edited_key="docs/new.pdf"))
    result = await EditPdfTool(editor).run(ToolContext(1, "p", allow_edit=False), {"original_text": "a", "new_text": "b"})
    assert "view-only" in result.answer and not result.is_edit and not result.remember
    assert editor.calls == []                                     # never even attempted


async def test_edit_tool_reports_success_with_count_and_warnings():
    editor = StubEditor(EditOutcome(True, edited_key="docs/new.pdf", replacements=2, warnings=["font substituted"]))
    result = await EditPdfTool(editor).run(CTX, {"original_text": "Old", "new_text": "New"})
    assert result.is_edit and result.edited_file_key == "docs/new.pdf"
    assert 'Changed "Old" → "New" in 2 places.' in result.answer and "- font substituted" in result.answer
    assert editor.calls == [("docs/x.pdf", "Old", "New")]


async def test_edit_tool_singular_wording_for_a_single_replacement():
    result = await EditPdfTool(StubEditor(EditOutcome(True, edited_key="k", replacements=1))).run(
        CTX, {"original_text": "a", "new_text": "b"})
    assert '"a" → "b".' in result.answer and "places" not in result.answer


async def test_edit_tool_explains_a_failed_edit_and_does_not_remember_it():
    result = await EditPdfTool(StubEditor(EditOutcome(False, message="Could not find 'zzz'."))).run(
        CTX, {"original_text": "zzz", "new_text": "y"})
    assert "couldn't make that edit" in result.answer and "zzz" in result.answer
    assert not result.is_edit and not result.remember


def test_registry_lists_specs_and_looks_tools_up_by_name():
    registry = ToolRegistry([AnswerQuestionTool(), SummarizeTool()])
    assert [s.name for s in registry.specs()] == ["answer_question", "summarize"]
    assert registry.get("summarize") is not None and registry.get("nope") is None
    for spec in registry.specs():                                 # what the model sees must be valid JSON schema
        assert spec.parameters["type"] == "object" and spec.parameters["required"]


# -- the assistant -------------------------------------------------------------------------
@pytest.fixture
async def assistant_env():
    fakes = Fakes()
    assistant = container.build_assistant(
        fakes.llm, container.build_retriever(fakes.embedder, fakes.vectors), fakes.memory, fakes.storage)
    indexer = container.build_indexer(fakes.embedder, fakes.vectors)
    await indexer.index(1, ["The notice period is thirty days.", "Salary is paid monthly."])
    return fakes, assistant


async def test_answers_using_retrieved_context_and_cites_the_pages(assistant_env):
    fakes, assistant = assistant_env
    fakes.llm.will_return(tool("answer_question", response="Thirty days (page 1)."))
    reply = await assistant.reply("What is the notice period?", CTX)

    assert reply.answer == "Thirty days (page 1)." and not reply.is_edit and not reply.failed
    assert reply.citations and "1" in reply.citations
    call = fakes.llm.calls[0]
    assert call["tool_choice"] == "required"                       # the model must pick a tool
    assert {t.name for t in call["tools"]} == {"answer_question", "summarize", "edit_pdf"}
    assert call["messages"][0].role == "system" and "DocuQuery" in call["messages"][0].content
    assert "[Page 1]" in call["messages"][-1].content and "What is the notice period?" in call["messages"][-1].content


async def test_history_is_sent_to_the_model_and_the_new_exchange_is_remembered(assistant_env):
    fakes, assistant = assistant_env
    await fakes.memory.append(1, "user", "earlier question")
    await fakes.memory.append(1, "assistant", "earlier answer")
    await assistant.reply("follow up", CTX)

    roles = [m.role for m in fakes.llm.calls[0]["messages"]]
    assert roles == ["system", "user", "assistant", "user"]
    turns = await fakes.memory.get(1)
    assert [(t.role, t.content) for t in turns[-2:]] == [("user", "follow up"), ("assistant", "Fake answer")]


async def test_falls_back_to_the_start_of_the_document_when_nothing_is_indexed(assistant_env):
    fakes, assistant = assistant_env

    async def fallback():
        return "RAW DOCUMENT TEXT " * 500

    await assistant.reply("anything", ToolContext(document_id=404, file_path="p"), fallback_context=fallback)
    user_prompt = fakes.llm.calls[0]["messages"][-1].content
    assert "RAW DOCUMENT TEXT" in user_prompt and len(user_prompt) < 3300     # capped at 3000 chars of context


async def test_fallback_is_not_read_when_retrieval_already_found_context(assistant_env):
    _, assistant = assistant_env

    async def fallback():
        raise AssertionError("must not download the PDF when the index has the answer")

    await assistant.reply("notice period", CTX, fallback_context=fallback)


@pytest.mark.parametrize("error,message", [
    (LLMRateLimitError("slow down"), RATE_LIMITED),
    (LLMQuotaError("no credit"), OUT_OF_QUOTA),
    (LLMUnavailableError("503"), UNAVAILABLE),
])
async def test_provider_failures_become_friendly_failed_replies_and_are_not_remembered(assistant_env, error, message):
    fakes, assistant = assistant_env
    fakes.llm.will_return(error)
    reply = await assistant.reply("q", CTX)
    assert (reply.answer, reply.failed, reply.is_edit) == (message, True, False)
    assert await fakes.memory.get(1) == []


async def test_a_plain_text_or_unknown_tool_response_still_yields_an_answer(assistant_env):
    fakes, assistant = assistant_env
    fakes.llm.will_return(LLMResponse(text="Plain text answer"), tool("no_such_tool", x="1"), LLMResponse())
    assert (await assistant.reply("q", CTX)).answer == "Plain text answer"
    assert (await assistant.reply("q", CTX)).answer == NO_ANSWER
    assert (await assistant.reply("q", CTX)).answer == NO_ANSWER


async def test_an_edit_goes_through_the_edit_tool_and_returns_the_new_file_key(assistant_env):
    fakes, assistant = assistant_env
    key = fakes.storage.new_key()
    await fakes.storage.put(key, make_pdf("Name: Ada Lovelace"))
    fakes.llm.will_return(tool("edit_pdf", original_text="Ada", new_text="Grace"))
    reply = await assistant.reply("Change Ada to Grace", ToolContext(1, key, allow_edit=True))
    assert reply.is_edit and reply.edited_file_key and reply.edited_file_key != key
    assert reply.edited_file_key in fakes.storage.files


async def test_a_custom_tool_can_be_registered_without_touching_the_assistant():
    class ShoutTool:
        spec = AnswerQuestionTool.spec.__class__(name="shout", description="d", parameters={"type": "object", "properties": {}, "required": []})

        async def run(self, ctx, args):
            from app.rag.tools import ToolResult
            return ToolResult(answer="HEY", remember=False)

    fakes = Fakes()
    fakes.llm.will_return(tool("shout"))
    assistant = DocumentAssistant(fakes.llm, container.build_retriever(fakes.embedder, fakes.vectors),
                                  fakes.memory, ToolRegistry([ShoutTool()]))
    assert (await assistant.reply("q", CTX)).answer == "HEY"
