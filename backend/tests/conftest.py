"""
Shared fixtures for the DocuQuery test suite.

All os.environ assignments happen at module level — before any app code is
imported — so database.py, redis_service.py, etc. pick up the fake values.
"""
import os

# ── env vars first, before any app import ───────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite:///./test_docuquery.db"
os.environ["GEMINI_API_KEY"] = "test-gemini-key"
os.environ["SECRET_KEY"] = "test-secret-key-32-chars-minimum!"
os.environ["ENVIRONMENT"] = "development"
os.environ["AWS_ACCESS_KEY"] = "test-aws-key"
os.environ["AWS_SECRET_KEY"] = "test-aws-secret"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["AWS_BUCKET_NAME"] = "test-bucket"
os.environ["UPSTASH_REDIS_REST_URL"] = "https://test-redis.upstash.io"
os.environ["UPSTASH_REDIS_REST_TOKEN"] = "test-redis-token"
os.environ["UPSTASH_VECTOR_REST_URL"] = "https://test-vector.upstash.io"
os.environ["UPSTASH_VECTOR_REST_TOKEN"] = "test-vector-token"

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base
from app import database as app_database
from app.main import app

# ── test database (SQLite, file-based for thread safety) ────────────────────
TEST_DB_URL = "sqlite:///./test_docuquery.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


# ── session-scoped: create tables once, drop at end ─────────────────────────
@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("test_docuquery.db"):
        os.remove("test_docuquery.db")


# ── function-scoped DB session with rollback ─────────────────────────────────
@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# ── patch all external service clients ──────────────────────────────────────
@pytest.fixture
def mock_redis():
    with patch("app.services.redis_service._redis") as m:
        m.lrange.return_value = []
        m.rpush.return_value = 1
        m.llen.return_value = 1
        m.expire.return_value = True
        m.delete.return_value = 1
        m.ltrim.return_value = True
        yield m


@pytest.fixture
def mock_vector_index():
    with patch("app.services.vector_service._index") as m:
        m.upsert.return_value = None
        m.query.return_value = []
        m.delete.return_value = None
        yield m


@pytest.fixture
def mock_vector_gemini():
    with patch("app.services.vector_service._gemini") as m:
        embedding = MagicMock()
        embedding.values = [0.1] * 768
        result = MagicMock()
        result.embeddings = [embedding]
        m.models.embed_content.return_value = result
        yield m


@pytest.fixture
def mock_pdf_client():
    with patch("app.services.pdf_service._client") as m:
        yield m


@pytest.fixture
def mock_s3():
    with patch("app.services.pdf_service.s3_client") as m:
        yield m


# ── TestClient with dependency override ─────────────────────────────────────
@pytest.fixture
def client(mock_redis, mock_vector_index, mock_vector_gemini, mock_pdf_client, mock_s3):
    app.dependency_overrides[app_database.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── helper: register a user and return Bearer token ─────────────────────────
@pytest.fixture
def auth_token(client):
    resp = client.post("/signup", json={
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "securepassword123",
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
