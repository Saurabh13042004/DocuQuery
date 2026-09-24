"""Composition root: the one place that knows which concrete adapter implements each port.

Everything is built lazily and cached, so importing the app needs no credentials and each external
client is created once. The API layer reaches these through ``app.api.deps`` (overridable in tests);
scripts call them directly.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.infrastructure.cache.redis_memory import RedisChatMemory
from app.infrastructure.email.smtp import SmtpMailer
from app.infrastructure.llm.openai_client import OpenAIChatClient
from app.infrastructure.llm.openai_embedder import OpenAIEmbedder
from app.infrastructure.storage.blob import BlobStorage
from app.infrastructure.storage.legacy import LegacyAwareStorage
from app.infrastructure.vectorstore.upstash import UpstashVectorStore
from app.pdf.edit_service import PdfEditService
from app.ports import FileStorage, Mailer
from app.rag.assistant import DocumentAssistant
from app.rag.indexer import DocumentIndexer
from app.rag.interfaces import ChatMemory, Embedder, LLMClient, Retriever, VectorStore
from app.rag.retriever import VectorRetriever
from app.rag.tools import AnswerQuestionTool, EditPdfTool, SummarizeTool, ToolRegistry


@lru_cache
def storage() -> FileStorage:
    s = get_settings()
    s.require("upstash_blob_token")
    return LegacyAwareStorage(BlobStorage(s.upstash_blob_token))


@lru_cache
def embedder() -> Embedder:
    s = get_settings()
    s.require("openai_api_key")
    return OpenAIEmbedder(s.openai_api_key, s.openai_embedding_model, s.embedding_dimensions)


@lru_cache
def vector_store() -> VectorStore:
    s = get_settings()
    s.require("upstash_vector_url", "upstash_vector_token")
    return UpstashVectorStore(s.upstash_vector_url, s.upstash_vector_token)


@lru_cache
def llm() -> LLMClient:
    s = get_settings()
    s.require("openai_api_key")
    return OpenAIChatClient(s.openai_api_key, s.openai_chat_model)


@lru_cache
def chat_memory() -> ChatMemory:
    s = get_settings()
    s.require("upstash_redis_url", "upstash_redis_token")
    return RedisChatMemory(s.upstash_redis_url, s.upstash_redis_token)


@lru_cache
def mailer() -> Mailer:
    return SmtpMailer(get_settings())


def build_indexer(embedder_: Embedder, store: VectorStore) -> DocumentIndexer:
    return DocumentIndexer(embedder_, store)


def build_retriever(embedder_: Embedder, store: VectorStore) -> Retriever:
    return VectorRetriever(embedder_, store)


def build_assistant(llm_: LLMClient, retriever: Retriever, memory: ChatMemory, storage_: FileStorage) -> DocumentAssistant:
    tools = ToolRegistry([AnswerQuestionTool(), SummarizeTool(), EditPdfTool(PdfEditService(storage_))])
    return DocumentAssistant(llm_, retriever, memory, tools)
