from __future__ import annotations

import asyncio

import httpx

from app.ports import FileStorage


class LegacyAwareStorage:
    """Wraps the real storage and can still read documents stored before Blob: local paths and S3 URLs.

    New files always go to the wrapped storage; only ``get`` understands the old locations.
    """

    def __init__(self, inner: FileStorage):
        self.inner = inner

    def new_key(self, prefix: str = "") -> str:
        return self.inner.new_key(prefix)

    def owns(self, key: str | None) -> bool:
        return self.inner.owns(key)

    async def put(self, key: str, data: bytes, content_type: str = "application/pdf") -> None:
        await self.inner.put(key, data, content_type)

    async def delete(self, key: str) -> None:
        await self.inner.delete(key)

    async def get(self, key: str) -> bytes:
        if self.inner.owns(key):
            return await self.inner.get(key)
        if key.startswith("http"):
            async with httpx.AsyncClient() as client:
                resp = await client.get(key)
                resp.raise_for_status()
                return resp.content
        return await asyncio.to_thread(self._read_local, key)

    @staticmethod
    def _read_local(path: str) -> bytes:
        with open(path, "rb") as f:
            return f.read()
