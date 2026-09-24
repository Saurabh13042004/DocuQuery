from __future__ import annotations

from typing import Sequence

from app.rag.interfaces import Embedder, VectorStore
from app.rag.types import Retrieval


class VectorRetriever:
    """Embeds the question and asks the vector store for the closest chunks."""

    def __init__(self, embedder: Embedder, store: VectorStore, top_k: int = 5):
        self.embedder = embedder
        self.store = store
        self.top_k = top_k

    async def retrieve(self, question: str, document_ids: Sequence[int]) -> Retrieval:
        [embedding] = await self.embedder.embed([question])
        chunks = await self.store.query(embedding, question, document_ids, self.top_k)
        return Retrieval(chunks=chunks)
