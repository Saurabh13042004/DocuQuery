from __future__ import annotations

import logging
from dataclasses import dataclass, replace
from typing import Awaitable, Callable

from app.rag.errors import LLMQuotaError, LLMRateLimitError, LLMUnavailableError
from app.rag.interfaces import ChatMemory, LLMClient, Retriever
from app.rag.prompts import SYSTEM_PROMPT, user_message
from app.rag.tools import ToolContext, ToolRegistry, ToolResult
from app.rag.types import ChatTurn, LLMResponse, Retrieval

log = logging.getLogger(__name__)

FALLBACK_CONTEXT_CHARS = 3000

RATE_LIMITED = "The AI service is temporarily rate-limited. Please wait a moment and try again."
OUT_OF_QUOTA = "The AI service is out of quota right now. Please contact support."
UNAVAILABLE = "The AI service is experiencing high demand right now. Please try again in a moment."
NO_ANSWER = "I couldn't process your request."


@dataclass
class AssistantReply:
    answer: str
    is_edit: bool = False
    citations: list[str] | None = None
    edited_file_key: str | None = None
    failed: bool = False  # the model provider failed; the answer is an apology, not a result


class DocumentAssistant:
    """Answers questions about a document and performs edits through registered tools.

    One turn = retrieve -> build messages -> call the model (forced tool call) -> run the tool ->
    remember. Each step is its own method so it can become a node in an agent graph later.
    """

    def __init__(
        self,
        llm: LLMClient,
        retriever: Retriever,
        memory: ChatMemory,
        tools: ToolRegistry,
        system_prompt: str = SYSTEM_PROMPT,
    ):
        self.llm = llm
        self.retriever = retriever
        self.memory = memory
        self.tools = tools
        self.system_prompt = system_prompt

    async def reply(
        self,
        question: str,
        ctx: ToolContext,
        fallback_context: Callable[[], Awaitable[str]] | None = None,
    ) -> AssistantReply:
        retrieval = await self.retrieve(question, ctx)
        context = retrieval.context
        if not context and fallback_context:  # nothing indexed yet: use the start of the document
            context = (await fallback_context())[:FALLBACK_CONTEXT_CHARS]

        messages = await self.build_messages(question, context, ctx)
        try:
            response = await self.llm.chat(messages, self.tools.specs(), tool_choice="required")
        except LLMRateLimitError:
            return AssistantReply(RATE_LIMITED, failed=True)
        except LLMQuotaError:
            return AssistantReply(OUT_OF_QUOTA, failed=True)
        except LLMUnavailableError:
            return AssistantReply(UNAVAILABLE, failed=True)

        result = await self.run_tool(response, replace(ctx, source_pages=retrieval.pages))
        if result.remember:
            await self.remember(ctx.document_id, question, result.answer)
        return AssistantReply(
            answer=result.answer, is_edit=result.is_edit,
            citations=result.citations, edited_file_key=result.edited_file_key)

    async def retrieve(self, question: str, ctx: ToolContext) -> Retrieval:
        return await self.retriever.retrieve(question, [ctx.document_id])

    async def build_messages(self, question: str, context: str, ctx: ToolContext) -> list[ChatTurn]:
        history = await self.memory.get(ctx.document_id)
        return [
            ChatTurn("system", self.system_prompt),
            *history,
            ChatTurn("user", user_message(context, question)),
        ]

    async def run_tool(self, response: LLMResponse, ctx: ToolContext) -> ToolResult:
        call = response.tool_calls[0] if response.tool_calls else None
        tool = self.tools.get(call.name) if call else None
        if tool is None:  # the model answered in plain text (or named an unknown tool)
            return ToolResult(answer=response.text or NO_ANSWER)
        return await tool.run(ctx, call.arguments)

    async def remember(self, document_id: int, question: str, answer: str) -> None:
        await self.memory.append(document_id, "user", question)
        await self.memory.append(document_id, "assistant", answer)
