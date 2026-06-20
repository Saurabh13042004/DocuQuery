"""Unit tests for app/services/auth_service.py"""
import pytest
from datetime import timedelta
from fastapi import HTTPException
from unittest.mock import MagicMock

import jwt

from app.services import auth_service
from app import models, schemas


# ── password hashing ─────────────────────────────────────────────────────────

def test_hash_password_produces_bcrypt_hash():
    h = auth_service.hash_password("mypassword")
    assert h.startswith("$2b$")


def test_hash_password_is_not_plaintext():
    h = auth_service.hash_password("mypassword")
    assert h != "mypassword"


def test_hash_password_two_hashes_differ():
    h1 = auth_service.hash_password("mypassword")
    h2 = auth_service.hash_password("mypassword")
    assert h1 != h2  # different salts each time


def test_verify_password_correct():
    h = auth_service.hash_password("correct")
    assert auth_service.verify_password("correct", h) is True


def test_verify_password_wrong():
    h = auth_service.hash_password("correct")
    assert auth_service.verify_password("wrong", h) is False


# ── JWT tokens ───────────────────────────────────────────────────────────────

def test_create_access_token_is_string():
    token = auth_service.create_access_token({"sub": "user@example.com"})
    assert isinstance(token, str)


def test_decode_token_returns_payload():
    token = auth_service.create_access_token({"sub": "user@example.com"})
    payload = auth_service.decode_token(token)
    assert payload["sub"] == "user@example.com"


def test_decode_token_custom_expiry():
    token = auth_service.create_access_token(
        {"sub": "user@example.com"},
        expires_delta=timedelta(hours=1)
    )
    payload = auth_service.decode_token(token)
    assert payload["sub"] == "user@example.com"


def test_decode_expired_token_raises():
    token = auth_service.create_access_token(
        {"sub": "user@example.com"},
        expires_delta=timedelta(seconds=-1)
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        auth_service.decode_token(token)


def test_decode_invalid_token_raises():
    with pytest.raises(jwt.PyJWTError):
        auth_service.decode_token("this.is.not.a.valid.jwt")


# ── database operations ───────────────────────────────────────────────────────

def test_get_user_by_email_returns_none_when_not_found(db):
    result = auth_service.get_user_by_email(db, "nonexistent@example.com")
    assert result is None


def test_create_user_success(db):
    user_schema = schemas.UserCreate(
        name="Alice",
        email="alice@example.com",
        password="alicepassword",
    )
    user = auth_service.create_user(db, user_schema)
    assert user.id is not None
    assert user.email == "alice@example.com"
    assert user.name == "Alice"
    assert user.hashed_password != "alicepassword"


def test_create_user_stores_hashed_password(db):
    user_schema = schemas.UserCreate(
        name="Bob",
        email="bob@example.com",
        password="bobpassword",
    )
    user = auth_service.create_user(db, user_schema)
    assert auth_service.verify_password("bobpassword", user.hashed_password)


def test_create_user_duplicate_email_raises(db):
    user_schema = schemas.UserCreate(
        name="Charlie",
        email="charlie@example.com",
        password="charliepass",
    )
    auth_service.create_user(db, user_schema)
    with pytest.raises(HTTPException) as exc_info:
        auth_service.create_user(db, user_schema)
    assert exc_info.value.status_code == 400
    assert "already registered" in exc_info.value.detail


def test_get_user_by_email_after_create(db):
    user_schema = schemas.UserCreate(
        name="Diana",
        email="diana@example.com",
        password="dianapass",
    )
    created = auth_service.create_user(db, user_schema)
    found = auth_service.get_user_by_email(db, "diana@example.com")
    assert found is not None
    assert found.id == created.id


def test_authenticate_user_success(db):
    user_schema = schemas.UserCreate(
        name="Eve",
        email="eve@example.com",
        password="evepassword",
    )
    auth_service.create_user(db, user_schema)
    user = auth_service.authenticate_user(db, "eve@example.com", "evepassword")
    assert user is not None
    assert user.email == "eve@example.com"


def test_authenticate_user_wrong_password(db):
    user_schema = schemas.UserCreate(
        name="Frank",
        email="frank@example.com",
        password="frankpassword",
    )
    auth_service.create_user(db, user_schema)
    result = auth_service.authenticate_user(db, "frank@example.com", "wrongpassword")
    assert result is None


def test_authenticate_user_nonexistent_email(db):
    result = auth_service.authenticate_user(db, "ghost@example.com", "anypassword")
    assert result is None
