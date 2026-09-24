"""Interfaces for infrastructure the application depends on (dependency inversion).

Services and the RAG pipeline are written against these Protocols; concrete adapters live in
``app.infrastructure`` and tests pass in-memory fakes.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class FileStorage(Protocol):
    def new_key(self, prefix: str = "") -> str: ...
    async def put(self, key: str, data: bytes, content_type: str = "application/pdf") -> None: ...
    async def get(self, key: str) -> bytes:
        """Raises FileNotFoundError when the object does not exist."""
        ...
    async def delete(self, key: str) -> None: ...
    def owns(self, key: str | None) -> bool:
        """True for keys this storage manages (as opposed to legacy local paths / URLs)."""
        ...


@dataclass(frozen=True)
class PasswordResetMessage:
    to: str
    name: str
    token: str
    minutes: int


class Mailer(Protocol):
    def send_password_reset(self, message: PasswordResetMessage) -> bool: ...
