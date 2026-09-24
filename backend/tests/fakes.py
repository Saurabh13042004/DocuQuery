"""In-memory stand-ins for the ports, so tests run the real application code with no network."""
from __future__ import annotations

import hashlib
import math
import uuid
from collections import defaultdict

from app.ports import PasswordResetMessage
from app.rag.errors import LLMError
from app.rag.types import ChatTurn, LLMResponse, RetrievedChunk, ToolCall, ToolSpec, VectorRecord

DIM = 64


def _vector(text: str) -> list[float]:
    """Bag-of-words hashed into DIM buckets, L2-normalised: similar texts get similar vectors."""
    vec = [0.0] * DIM
    for word in text.lower().split():
        vec[int(hashlib.md5(word.strip(".,?!:;()").encode()).hexdigest(), 16) % DIM] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


class FakeEmbedder:
    def __init__(self):
        self.calls: list[list[str]] = []

    async def embed(self, texts):
        self.calls.append(list(texts))
        return [_vector(t) for t in texts]


class InMemoryVectorStore:
    def __init__(self):
        self.records: dict[str, VectorRecord] = {}
        self.fail_upsert: Exception | None = None

    async def upsert(self, records):
        if self.fail_upsert:
            raise self.fail_upsert
        for r in records:
            self.records[r.id] = r

    async def query(self, embedding, text, document_ids, top_k):
        wanted = set(document_ids)
        scored = [
            (sum(a * b for a, b in zip(embedding, r.embedding)), r)
            for r in self.records.values() if r.document_id in wanted
        ]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [
            RetrievedChunk(text=r.text, page=r.page, document_id=r.document_id, chunk_index=r.chunk_index, score=s)
            for s, r in scored[:top_k] if s > 0
        ]

    async def delete_document(self, document_id):
        self.records = {k: v for k, v in self.records.items() if v.document_id != document_id}

    def for_document(self, document_id: int) -> list[VectorRecord]:
        return [r for r in self.records.values() if r.document_id == document_id]


def tool(name: str, **arguments) -> LLMResponse:
    return LLMResponse(tool_calls=[ToolCall(name, arguments)])


class FakeLLM:
    """Plays back scripted responses (or raises scripted errors); records what it was asked."""

    def __init__(self):
        self.script: list[LLMResponse | Exception] = []
        self.calls: list[dict] = []

    def will_return(self, *items: LLMResponse | Exception) -> "FakeLLM":
        self.script.extend(items)
        return self

    async def chat(self, messages, tools: list[ToolSpec], tool_choice: str = "auto"):
        self.calls.append({"messages": list(messages), "tools": list(tools), "tool_choice": tool_choice})
        item = self.script.pop(0) if self.script else tool("answer_question", response="Fake answer")
        if isinstance(item, Exception):
            raise item
        return item


class InMemoryChatMemory:
    def __init__(self):
        self.turns: dict[int, list[ChatTurn]] = defaultdict(list)

    async def get(self, document_id):
        return list(self.turns[document_id])

    async def append(self, document_id, role, content):
        self.turns[document_id].append(ChatTurn(role, content))

    async def clear(self, document_id):
        self.turns.pop(document_id, None)


class InMemoryStorage:
    prefix = "docs/"

    def __init__(self):
        self.files: dict[str, bytes] = {}
        self.fail_put: Exception | None = None

    def new_key(self, prefix: str = "") -> str:
        return f"{self.prefix}{prefix}{uuid.uuid4().hex}.pdf"

    def owns(self, key):
        return bool(key) and key.startswith(self.prefix)

    async def put(self, key, data, content_type="application/pdf"):
        if self.fail_put:
            raise self.fail_put
        self.files[key] = data

    async def get(self, key):
        try:
            return self.files[key]
        except KeyError:
            raise FileNotFoundError(key)

    async def delete(self, key):
        self.files.pop(key, None)


class RecordingMailer:
    def __init__(self):
        self.sent: list[PasswordResetMessage] = []

    def send_password_reset(self, message):
        self.sent.append(message)
        return True


class Fakes:
    """One of each fake, wired together the way the container wires the real adapters."""

    def __init__(self):
        self.embedder = FakeEmbedder()
        self.vectors = InMemoryVectorStore()
        self.llm = FakeLLM()
        self.memory = InMemoryChatMemory()
        self.storage = InMemoryStorage()
        self.mailer = RecordingMailer()


__all__ = ["Fakes", "FakeLLM", "LLMError", "tool"]
