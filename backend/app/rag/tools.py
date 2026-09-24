"""Tools the model can call. Each tool is self-contained: a spec (what the model sees) and a run().

Framework-neutral on purpose: a LangGraph ToolNode or an ADK FunctionTool can wrap these, and new
capabilities (extract to table, compare documents, ...) are added by registering another tool
rather than editing the assistant (open/closed).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from app.pdf.edit_service import PdfEditService
from app.rag.types import ToolSpec


@dataclass(frozen=True)
class ToolContext:
    document_id: int
    file_path: str
    allow_edit: bool = True
    source_pages: list[int] = field(default_factory=list)


@dataclass
class ToolResult:
    answer: str
    is_edit: bool = False
    edited_file_key: str | None = None
    citations: list[str] | None = None
    remember: bool = True  # store this exchange in the chat memory


class AgentTool(Protocol):
    spec: ToolSpec

    async def run(self, ctx: ToolContext, args: dict) -> ToolResult: ...


def _schema(**properties: str) -> dict:
    return {
        "type": "object",
        "properties": {name: {"type": "string", "description": desc} for name, desc in properties.items()},
        "required": list(properties),
    }


class AnswerQuestionTool:
    spec = ToolSpec(
        name="answer_question",
        description="Answer a question about the PDF document using its content.",
        parameters=_schema(response="The answer to the user's question based on the document."),
    )

    async def run(self, ctx: ToolContext, args: dict) -> ToolResult:
        return ToolResult(answer=args.get("response", ""), citations=[str(p) for p in ctx.source_pages])


class SummarizeTool:
    spec = ToolSpec(
        name="summarize",
        description="Summarize the PDF document or a section of it.",
        parameters=_schema(summary="A clear and comprehensive summary of the document content."),
    )

    async def run(self, ctx: ToolContext, args: dict) -> ToolResult:
        return ToolResult(answer=args.get("summary", ""), citations=[str(p) for p in ctx.source_pages])


class EditPdfTool:
    spec = ToolSpec(
        name="edit_pdf",
        description="Replace specific text in the PDF. Use when user wants to change, update, or modify document content.",
        parameters=_schema(
            original_text="The exact text to find and replace in the PDF.",
            new_text="The replacement text.",
        ),
    )

    def __init__(self, editor: PdfEditService):
        self.editor = editor

    async def run(self, ctx: ToolContext, args: dict) -> ToolResult:
        if not ctx.allow_edit:
            return ToolResult(
                answer="You have view-only access to this document, so I can't edit it.", remember=False)

        original, new = args.get("original_text", ""), args.get("new_text", "")
        outcome = await self.editor.edit(ctx.file_path, original, new)
        if not outcome.success:
            return ToolResult(
                answer=f"I couldn't make that edit: {outcome.message}. Try being more specific about the exact text.",
                remember=False,
            )

        answer = f'Done! Changed "{original}" → "{new}"'
        answer += f" in {outcome.replacements} places." if outcome.replacements > 1 else "."
        answer += " You can download the updated PDF."
        if outcome.warnings:
            answer += "\n\nHeads up:\n" + "\n".join(f"- {w}" for w in outcome.warnings)
        return ToolResult(answer=answer, is_edit=True, edited_file_key=outcome.edited_key)


class ToolRegistry:
    def __init__(self, tools: list[AgentTool] | None = None):
        self._tools: dict[str, AgentTool] = {}
        for tool in tools or []:
            self.register(tool)

    def register(self, tool: AgentTool) -> None:
        self._tools[tool.spec.name] = tool

    def get(self, name: str) -> AgentTool | None:
        return self._tools.get(name)

    def specs(self) -> list[ToolSpec]:
        return [t.spec for t in self._tools.values()]
