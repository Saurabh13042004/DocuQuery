from __future__ import annotations

from typing import Sequence

from app.rag.types import Chunk


class TextChunker:
    """Sliding word window, chunked per page so every chunk carries an accurate page number."""

    def __init__(self, size: int = 400, overlap: int = 50):
        if size <= 0 or not 0 <= overlap < size:
            raise ValueError("size must be positive and overlap must be smaller than size")
        self.size = size
        self.overlap = overlap

    def chunk_text(self, text: str) -> list[str]:
        words = text.split()
        step = self.size - self.overlap
        chunks = (" ".join(words[i:i + self.size]) for i in range(0, len(words), step))
        return [c for c in chunks if c.strip()]

    def chunk_pages(self, pages: Sequence[str]) -> list[Chunk]:
        chunks: list[Chunk] = []
        for page_number, page_text in enumerate(pages, start=1):
            for text in self.chunk_text(page_text):
                chunks.append(Chunk(text=text, page=page_number, index=len(chunks)))
        return chunks
