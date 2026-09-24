"""FastAPI dependencies: adapters from the container, per-request services, and the current user.

Tests replace the adapter providers (``get_llm``, ``get_vector_store``, ...) through
``app.dependency_overrides`` to run the whole stack on in-memory fakes.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import container
from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.models import User
from app.ports import FileStorage, Mailer
from app.rag.assistant import DocumentAssistant
from app.rag.indexer import DocumentIndexer
from app.rag.interfaces import ChatMemory, Embedder, LLMClient, Retriever, VectorStore
from app.repositories.documents import CommentRepository, DocumentRepository, MessageRepository
from app.repositories.teams import TeamRepository
from app.repositories.users import CreditRepository, UserRepository
from app.services.access_service import AccessService
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.comment_service import CommentService
from app.services.credit_service import CreditService
from app.services.document_service import DocumentService
from app.services.team_service import TeamService

DbSession = Annotated[Session, Depends(get_db)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


# -- adapters (override these in tests) -----------------------------------------------------
def get_storage() -> FileStorage:
    return container.storage()


def get_embedder() -> Embedder:
    return container.embedder()


def get_vector_store() -> VectorStore:
    return container.vector_store()


def get_llm() -> LLMClient:
    return container.llm()


def get_chat_memory() -> ChatMemory:
    return container.chat_memory()


def get_mailer() -> Mailer:
    return container.mailer()


Storage = Annotated[FileStorage, Depends(get_storage)]
Memory = Annotated[ChatMemory, Depends(get_chat_memory)]
MailerDep = Annotated[Mailer, Depends(get_mailer)]


def get_indexer(
    embedder: Annotated[Embedder, Depends(get_embedder)], store: Annotated[VectorStore, Depends(get_vector_store)]
) -> DocumentIndexer:
    return container.build_indexer(embedder, store)


def get_retriever(
    embedder: Annotated[Embedder, Depends(get_embedder)], store: Annotated[VectorStore, Depends(get_vector_store)]
) -> Retriever:
    return container.build_retriever(embedder, store)


def get_assistant(
    llm: Annotated[LLMClient, Depends(get_llm)],
    retriever: Annotated[Retriever, Depends(get_retriever)],
    memory: Memory,
    storage: Storage,
) -> DocumentAssistant:
    return container.build_assistant(llm, retriever, memory, storage)


# -- services (one set per request) ---------------------------------------------------------
def get_credit_service(db: DbSession) -> CreditService:
    return CreditService(db, CreditRepository(db))


def get_access_service(db: DbSession) -> AccessService:
    return AccessService(DocumentRepository(db), TeamRepository(db))


CreditsDep = Annotated[CreditService, Depends(get_credit_service)]
AccessDep = Annotated[AccessService, Depends(get_access_service)]


def get_auth_service(db: DbSession, credits: CreditsDep, settings: SettingsDep) -> AuthService:
    return AuthService(db, UserRepository(db), credits, settings)


def get_document_service(
    db: DbSession, access: AccessDep, credits: CreditsDep, storage: Storage, memory: Memory,
    indexer: Annotated[DocumentIndexer, Depends(get_indexer)], settings: SettingsDep,
) -> DocumentService:
    return DocumentService(db, DocumentRepository(db), access, credits, storage, indexer, memory, settings)


def get_chat_service(
    db: DbSession, access: AccessDep, credits: CreditsDep, storage: Storage,
    assistant: Annotated[DocumentAssistant, Depends(get_assistant)],
) -> ChatService:
    return ChatService(db, access, credits, MessageRepository(db), assistant, storage)


def get_team_service(db: DbSession, access: AccessDep, credits: CreditsDep) -> TeamService:
    return TeamService(db, TeamRepository(db), DocumentRepository(db), CreditRepository(db), credits, access)


def get_comment_service(db: DbSession, access: AccessDep) -> CommentService:
    return CommentService(db, CommentRepository(db), access)


AuthDep = Annotated[AuthService, Depends(get_auth_service)]
DocumentsDep = Annotated[DocumentService, Depends(get_document_service)]
ChatDep = Annotated[ChatService, Depends(get_chat_service)]
TeamsDep = Annotated[TeamService, Depends(get_team_service)]
CommentsDep = Annotated[CommentService, Depends(get_comment_service)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)], auth: AuthDep
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated")
    return auth.user_from_token(credentials.credentials)


CurrentUser = Annotated[User, Depends(get_current_user)]
