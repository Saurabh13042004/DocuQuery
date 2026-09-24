from __future__ import annotations

import asyncio
from typing import Sequence

from openai import OpenAI


class OpenAIEmbedder:
    def __init__(self, api_key: str, model: str, dimensions: int, client: OpenAI | None = None):
        self._client = client or OpenAI(api_key=api_key)
        self.model = model
        self.dimensions = dimensions

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        result = await asyncio.to_thread(
            self._client.embeddings.create, model=self.model, input=list(texts), dimensions=self.dimensions)
        return [item.embedding for item in result.data]
