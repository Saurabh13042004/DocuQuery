"""Build real services on top of a test session and the fakes (for service-level unit tests)."""
from __future__ import annotations

from types import SimpleNamespace

from app import container
from app.core.config import Settings
from app.models import User
from app.repositories.documents import CommentRepository, DocumentRepository, MessageRepository
from app.repositories.teams import TeamRepository
from app.repositories.users import CreditRepository, UserRepository
from app.schemas.auth import SignupRequest
from app.services.access_service import AccessService
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.comment_service import CommentService
from app.services.credit_service import CreditService
from app.services.document_service import DocumentService
from app.services.team_service import TeamService
from tests.helpers import unique_email


def build_services(db, fakes, settings: Settings) -> SimpleNamespace:
    credit_repo = CreditRepository(db)
    documents = DocumentRepository(db)
    teams = TeamRepository(db)
    credits = CreditService(db, credit_repo)
    access = AccessService(documents, teams)
    indexer = container.build_indexer(fakes.embedder, fakes.vectors)
    retriever = container.build_retriever(fakes.embedder, fakes.vectors)
    assistant = container.build_assistant(fakes.llm, retriever, fakes.memory, fakes.storage)
    return SimpleNamespace(
        credits=credits, access=access, indexer=indexer, assistant=assistant,
        auth=AuthService(db, UserRepository(db), credits, settings),
        documents=DocumentService(db, documents, access, credits, fakes.storage, indexer, fakes.memory, settings),
        chat=ChatService(db, access, credits, MessageRepository(db), assistant, fakes.storage),
        teams=TeamService(db, teams, documents, credit_repo, credits, access),
        comments=CommentService(db, CommentRepository(db), access),
        users=UserRepository(db), team_repo=teams,
    )


def make_user(svc, *, plan: str = "free", credits: int | None = None, name: str = "Test User") -> User:
    user, _ = svc.auth.signup(SignupRequest(name=name, email=unique_email(), password="password123"))
    if plan != "free":
        user.plan = plan
    if credits is not None:
        user.credits = credits
    svc.credits.db.commit()
    return user
