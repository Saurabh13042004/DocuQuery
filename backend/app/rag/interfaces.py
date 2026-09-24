from __future__ import annotations

from typing import Protocol, Sequence

from app.rag.types import Chunk, ChatTurn, LLMResponse, Retrieval, ToolSpec, VectorRecord, RetrievedChunk


class Embedder(Protocol):
    async def embed(self, texts: Sequence[str]) -> list[list[float]]: ...


class VectorStore(Protocol):
    async def upsert(self, records: Sequence[VectorRecord]) -> None: ...

    async def query(
        self, embedding: list[float], text: str, document_ids: Sequence[int], top_k: int
    ) -> list[RetrievedChunk]:
        """``text`` is the raw query, for stores that also do keyword (sparse) matching."""
        ...

    async def delete_document(self, document_id: int) -> None: ...


class Chunker(Protocol):
    def chunk_pages(self, pages: Sequence[str]) -> list[Chunk]: ...


class Retriever(Protocol):
    async def retrieve(self, question: str, document_ids: Sequence[int]) -> Retrieval: ...


class LLMClient(Protocol):
    async def chat(
        self, messages: Sequence[ChatTurn], tools: Sequence[ToolSpec], tool_choice: str = "auto"
    ) -> LLMResponse:
        """Raises the errors in ``app.rag.errors`` for rate limits, quota and outages."""
        ...


class ChatMemory(Protocol):
    async def get(self, document_id: int) -> list[ChatTurn]: ...
    async def append(self, document_id: int, role: str, content: str) -> None: ...
    async def clear(self, document_id: int) -> None: ...
