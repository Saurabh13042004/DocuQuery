from __future__ import annotations

import asyncio
import json

from upstash_redis import Redis

from app.rag.types import ChatTurn

MAX_TURNS = 20
TTL_SECONDS = 24 * 60 * 60


class RedisChatMemory:
    """Rolling per-document conversation history (last 20 messages, kept for 24 hours)."""

    def __init__(self, url: str, token: str, client: Redis | None = None):
        self._redis = client or Redis(url=url, token=token)

    @staticmethod
    def _key(document_id: int) -> str:
        return f"chat:{document_id}"

    async def get(self, document_id: int) -> list[ChatTurn]:
        raw = await asyncio.to_thread(self._redis.lrange, self._key(document_id), 0, -1)
        turns = (json.loads(item) for item in raw)
        return [ChatTurn(role=t["role"], content=t["content"]) for t in turns]

    async def append(self, document_id: int, role: str, content: str) -> None:
        def _do() -> None:
            key = self._key(document_id)
            self._redis.rpush(key, json.dumps({"role": role, "content": content}))
            length = self._redis.llen(key)
            if length > MAX_TURNS:
                self._redis.ltrim(key, length - MAX_TURNS, -1)
            self._redis.expire(key, TTL_SECONDS)
        await asyncio.to_thread(_do)

    async def clear(self, document_id: int) -> None:
        await asyncio.to_thread(self._redis.delete, self._key(document_id))
