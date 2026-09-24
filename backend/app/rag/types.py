from __future__ import annotations

from dataclasses import dataclass, field

CONTEXT_SEPARATOR = "\n\n---\n\n"


@dataclass(frozen=True)
class Chunk:
    text: str
    page: int = 0      # 1-based; 0 = unknown
    index: int = 0


@dataclass(frozen=True)
class VectorRecord:
    id: str
    embedding: list[float]
    text: str
    document_id: int
    chunk_index: int
    page: int


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    page: int
    document_id: int
    chunk_index: int
    score: float | None = None


@dataclass(frozen=True)
class Retrieval:
    chunks: list[RetrievedChunk] = field(default_factory=list)

    @property
    def pages(self) -> list[int]:
        return sorted({c.page for c in self.chunks if c.page})

    @property
    def context(self) -> str:
        """Chunks joined for the prompt, each tagged [Page N] so the model can cite pages."""
        parts = [f"[Page {c.page}]\n{c.text}" if c.page else c.text for c in self.chunks]
        return CONTEXT_SEPARATOR.join(parts)


@dataclass(frozen=True)
class ChatTurn:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    parameters: dict  # JSON schema


@dataclass(frozen=True)
class ToolCall:
    name: str
    arguments: dict


@dataclass(frozen=True)
class LLMResponse:
    tool_calls: list[ToolCall] = field(default_factory=list)
    text: str | None = None
