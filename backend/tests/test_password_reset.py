"""Password reset flow: /forgot-password and /reset-password."""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest

from app.services import auth_service

OLD_PASSWORD = "old-password-1"


@pytest.fixture
def account(client):
    """A freshly signed-up user. Users persist across tests, so the email is unique."""
    email = f"reset-{uuid.uuid4().hex[:10]}@example.com"
    resp = client.post("/signup", json={"name": "Reset Me", "email": email, "password": OLD_PASSWORD})
    assert resp.status_code == 200
    return {"email": email, "access_token": resp.json()["access_token"]}


def _request_reset(client, email):
    """Call /forgot-password and return (response, token that was emailed or None)."""
    with patch("app.api.routes.email_service.send_password_reset_email") as send:
        resp = client.post("/forgot-password", json={"email": email})
    token = send.call_args.args[2] if send.called else None
    return resp, token


class TestForgotPassword:
    def test_existing_account_gets_an_email_with_a_token(self, client, account):
        resp, token = _request_reset(client, account["email"])
        assert resp.status_code == 200
        assert token

    def test_unknown_account_gets_identical_response_and_no_email(self, client, account):
        known, _ = _request_reset(client, account["email"])
        unknown, token = _request_reset(client, "nobody-here@example.com")
        assert unknown.status_code == known.status_code == 200
        assert unknown.json() == known.json()
        assert token is None


class TestResetPassword:
    def test_reset_changes_password(self, client, account):
        _, token = _request_reset(client, account["email"])

        resp = client.post("/reset-password", json={"token": token, "password": "brand-new-pass"})
        assert resp.status_code == 200

        assert client.post("/login", json={"email": account["email"], "password": "brand-new-pass"}).status_code == 200
        assert client.post("/login", json={"email": account["email"], "password": OLD_PASSWORD}).status_code == 401

    def test_token_is_single_use(self, client, account):
        _, token = _request_reset(client, account["email"])
        assert client.post("/reset-password", json={"token": token, "password": "brand-new-pass"}).status_code == 200
        again = client.post("/reset-password", json={"token": token, "password": "another-pass-2"})
        assert again.status_code == 400

    def test_garbage_token_rejected(self, client):
        resp = client.post("/reset-password", json={"token": "not-a-jwt", "password": "brand-new-pass"})
        assert resp.status_code == 400

    def test_expired_token_rejected(self, client, account):
        _, token = _request_reset(client, account["email"])
        payload = jwt.decode(token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        payload["exp"] = datetime.now(timezone.utc) - timedelta(minutes=1)
        expired = jwt.encode(payload, auth_service.SECRET_KEY, algorithm=auth_service.ALGORITHM)
        resp = client.post("/reset-password", json={"token": expired, "password": "brand-new-pass"})
        assert resp.status_code == 400

    def test_login_token_cannot_reset_a_password(self, client, account):
        resp = client.post("/reset-password", json={"token": account["access_token"], "password": "brand-new-pass"})
        assert resp.status_code == 400

    def test_reset_token_cannot_be_used_as_a_login_token(self, client, account):
        _, token = _request_reset(client, account["email"])
        resp = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401

    def test_short_password_rejected_and_token_still_valid(self, client, account):
        _, token = _request_reset(client, account["email"])
        short = client.post("/reset-password", json={"token": token, "password": "short"})
        assert short.status_code == 422
        ok = client.post("/reset-password", json={"token": token, "password": "long-enough-pass"})
        assert ok.status_code == 200
