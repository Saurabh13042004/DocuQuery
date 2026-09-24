from __future__ import annotations

from typing import Sequence

from app.rag.chunking import TextChunker
from app.rag.interfaces import Chunker, Embedder, VectorStore
from app.rag.types import VectorRecord


def chunk_id(document_id: int, index: int | str) -> str:
    """``chunk_id(7, "")`` is the prefix shared by all of document 7's chunks."""
    return f"doc_{document_id}_chunk_{index}"


class DocumentIndexer:
    """chunk -> embed -> upsert. One place to change when the chunking or embedding strategy does."""

    def __init__(
        self, embedder: Embedder, store: VectorStore, chunker: Chunker | None = None, embed_batch: int = 50
    ):
        self.embedder = embedder
        self.store = store
        self.chunker = chunker or TextChunker()
        self.embed_batch = embed_batch

    async def index(self, document_id: int, pages: Sequence[str], *, replace: bool = False) -> int:
        """Index one document's pages and return the number of chunks stored.

        ``replace`` clears the document's existing vectors first (use when re-indexing).
        """
        chunks = self.chunker.chunk_pages(pages)
        if replace:
            await self.store.delete_document(document_id)
        if not chunks:
            return 0

        embeddings: list[list[float]] = []
        for start in range(0, len(chunks), self.embed_batch):
            batch = [c.text for c in chunks[start:start + self.embed_batch]]
            embeddings.extend(await self.embedder.embed(batch))

        await self.store.upsert([
            VectorRecord(
                id=chunk_id(document_id, c.index), embedding=vector, text=c.text,
                document_id=document_id, chunk_index=c.index, page=c.page,
            )
            for c, vector in zip(chunks, embeddings)
        ])
        return len(chunks)

    async def remove(self, document_id: int) -> None:
        await self.store.delete_document(document_id)
