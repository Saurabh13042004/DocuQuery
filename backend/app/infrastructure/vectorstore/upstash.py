from __future__ import annotations

import asyncio
import hashlib
import re
from collections import Counter
from typing import Sequence

from upstash_vector import Index, Vector
from upstash_vector.types import SparseVector

from app.rag.indexer import chunk_id
from app.rag.types import RetrievedChunk, VectorRecord

SPARSE_DIM = 50_000  # hash space for sparse term indices
_WORD = re.compile(r"\w+")
UPSERT_BATCH = 100


def sparse_vector(text: str) -> SparseVector:
    """Term-frequency vector over hashed words. Same function at index and query time, so the
    indices always line up."""
    words = _WORD.findall(text.lower())  # punctuation must not hide a word ("days." still counts)
    if not words:
        return SparseVector(indices=[0], values=[0.0])
    weights: dict[int, float] = {}
    for word, count in Counter(words).items():
        idx = int(hashlib.sha256(word.encode()).hexdigest(), 16) % SPARSE_DIM
        weights[idx] = weights.get(idx, 0.0) + count / len(words)
    return SparseVector(indices=list(weights), values=list(weights.values()))


def document_filter(document_ids: Sequence[int]) -> str:
    ids = [int(i) for i in document_ids]
    return f"document_id = {ids[0]}" if len(ids) == 1 else f"document_id IN ({', '.join(map(str, ids))})"


class UpstashVectorStore:
    """Upstash Vector index. Works with dense-only and hybrid (dense + sparse) indexes."""

    def __init__(self, url: str, token: str, index: Index | None = None):
        self._index = index or Index(url=url, token=token)
        self._hybrid: bool | None = None

    def _is_hybrid(self) -> bool:
        if self._hybrid is None:
            self._hybrid = self._index.info().sparse_index is not None
        return self._hybrid

    async def upsert(self, records: Sequence[VectorRecord]) -> None:
        hybrid = await asyncio.to_thread(self._is_hybrid)
        vectors = [
            Vector(
                id=r.id, vector=r.embedding,
                sparse_vector=sparse_vector(r.text) if hybrid else None,
                metadata={"document_id": r.document_id, "chunk_index": r.chunk_index,
                          "page_number": r.page, "text": r.text},
            )
            for r in records
        ]
        for start in range(0, len(vectors), UPSERT_BATCH):
            await asyncio.to_thread(self._index.upsert, vectors[start:start + UPSERT_BATCH])

    async def query(
        self, embedding: list[float], text: str, document_ids: Sequence[int], top_k: int
    ) -> list[RetrievedChunk]:
        hybrid = await asyncio.to_thread(self._is_hybrid)
        results = await asyncio.to_thread(
            lambda: self._index.query(
                vector=embedding,
                sparse_vector=sparse_vector(text) if hybrid else None,
                top_k=top_k,
                include_metadata=True,
                filter=document_filter(document_ids),
            )
        )
        return [
            RetrievedChunk(
                text=r.metadata["text"], page=r.metadata.get("page_number", 0),
                document_id=r.metadata.get("document_id", 0), chunk_index=r.metadata.get("chunk_index", 0),
                score=getattr(r, "score", None),
            )
            for r in results if r.metadata and "text" in r.metadata
        ]

    async def delete_document(self, document_id: int) -> None:
        await asyncio.to_thread(lambda: self._index.delete(prefix=chunk_id(document_id, "")))
