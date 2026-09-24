"""Shared fixtures.

Environment variables are set before anything from ``app`` is imported, and to fake values on
purpose: settings loading also reads the developer's real ``.env`` (without overriding what is
already set), so this guarantees a test can never reach a real service.
"""
import os

os.environ.update({
    "DATABASE_URL": "sqlite://",
    "SECRET_KEY": "test-secret-key-that-is-long-enough-for-hs256",
    "ENVIRONMENT": "development",
    "OPENAI_API_KEY": "test-openai-key",
    "UPSTASH_VECTOR_REST_URL": "https://test-vector.upstash.io",
    "UPSTASH_VECTOR_REST_TOKEN": "test-vector-token",
    "UPSTASH_REDIS_REST_URL": "https://test-redis.upstash.io",
    "UPSTASH_REDIS_REST_TOKEN": "test-redis-token",
    "UPSTASH_BLOB_TOKEN": "test-blob-token",
    "SMTP_HOST": "",
    "FRONTEND_URL": "http://localhost:5173",
    "CORS_ORIGINS": "",
})

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import deps
from app.core import security
from app.core.config import Settings, get_settings
from app.core.database import Base, get_db
from app.main import create_app
from tests.factories import build_services
from tests.fakes import Fakes
from tests.helpers import unique_email


security.BCRYPT_ROUNDS = 4  # hashing at production cost would dominate the test run


@pytest.fixture
def settings() -> Settings:
    return get_settings()


@pytest.fixture
def db_session_factory():
    """A fresh in-memory database per test."""
    import app.models  # noqa: F401
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, expire_on_commit=True)
    engine.dispose()


@pytest.fixture
def db(db_session_factory):
    session = db_session_factory()
    yield session
    session.close()


@pytest.fixture
def fakes() -> Fakes:
    return Fakes()


@pytest.fixture
def svc(db, fakes, settings):
    """Every service wired to the test session and the fakes (see tests/factories.py)."""
    return build_services(db, fakes, settings)


@pytest.fixture
def client(db_session_factory, fakes):
    app = create_app(init_schema=False)

    def _db():
        session = db_session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides.update({
        get_db: _db,
        deps.get_storage: lambda: fakes.storage,
        deps.get_embedder: lambda: fakes.embedder,
        deps.get_vector_store: lambda: fakes.vectors,
        deps.get_llm: lambda: fakes.llm,
        deps.get_chat_memory: lambda: fakes.memory,
        deps.get_mailer: lambda: fakes.mailer,
    })
    with TestClient(app) as c:
        yield c


class Account:
    """A signed-up user: credentials plus ready-made auth headers."""

    def __init__(self, email: str, headers: dict, data: dict):
        self.email, self.headers, self.data = email, headers, data

    @property
    def id(self) -> int:
        return self.data["user"]["id"]


@pytest.fixture
def signup(client):
    def _signup(plan: str | None = None, name: str = "Test User", password: str = "password123") -> Account:
        email = unique_email()
        resp = client.post("/signup", json={"name": name, "email": email, "password": password})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        account = Account(email, {"Authorization": f"Bearer {data['access_token']}"}, data)
        if plan:
            assert client.post("/upgrade-plan", headers=account.headers, json={"plan": plan}).status_code == 200
        return account
    return _signup


@pytest.fixture
def user(signup) -> Account:
    return signup()
