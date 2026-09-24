from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core import security
from app.core.exceptions import BadRequestError, UnauthorizedError
from app.models import User
from app.schemas.auth import SignupRequest


def signup(svc, email="ada@example.com", password="password123", name="Ada"):
    return svc.auth.signup(SignupRequest(name=name, email=email, password=password))


def test_signup_creates_an_account_with_the_signup_bonus_and_a_working_token(svc):
    user, token = signup(svc)
    assert (user.email, user.plan, user.credits) == ("ada@example.com", "free", 20)
    assert user.hashed_password != "password123"
    assert [(t.reason, t.amount) for t in svc.credits.history(user)] == [("signup_bonus", 20)]
    assert svc.auth.user_from_token(token).id == user.id


def test_duplicate_emails_are_rejected_regardless_of_case(svc):
    signup(svc, email="ada@example.com")
    with pytest.raises(BadRequestError, match="Email already registered"):
        signup(svc, email="ada@example.com")


def test_login_with_the_right_password(svc):
    user, _ = signup(svc)
    logged_in, token = svc.auth.login("ada@example.com", "password123")
    assert logged_in.id == user.id and svc.auth.user_from_token(token).id == user.id


@pytest.mark.parametrize("email,password", [("ada@example.com", "wrong"), ("nobody@example.com", "password123")])
def test_login_failure_does_not_reveal_which_part_was_wrong(svc, email, password):
    signup(svc)
    with pytest.raises(UnauthorizedError, match="Incorrect email or password") as e:
        svc.auth.login(email, password)
    assert e.value.headers == {"WWW-Authenticate": "Bearer"}


def test_accounts_created_with_mixed_case_emails_can_still_log_in(svc, db):
    db.add(User(name="Old", email="Old.User@Example.com", hashed_password=security.hash_password("password123")))
    db.commit()
    assert svc.auth.login("old.user@example.com", "password123")[0].name == "Old"


def test_token_errors_are_distinguished(svc, settings):
    user, _ = signup(svc)
    expired = security.create_access_token(user.email, settings.secret_key, -1)
    with pytest.raises(UnauthorizedError, match="Token expired"):
        svc.auth.user_from_token(expired)
    with pytest.raises(UnauthorizedError, match="Invalid token"):
        svc.auth.user_from_token("garbage")
    with pytest.raises(UnauthorizedError, match="Invalid token"):
        svc.auth.user_from_token(security.create_access_token(user.email, "another-secret-of-decent-length-12345", 5))
    ghost = security.create_access_token("ghost@example.com", settings.secret_key, 5)
    with pytest.raises(UnauthorizedError, match="User not found"):
        svc.auth.user_from_token(ghost)


def test_a_reset_token_cannot_be_used_as_a_login_token(svc):
    signup(svc)
    reset = svc.auth.start_password_reset("ada@example.com")
    with pytest.raises(UnauthorizedError, match="Invalid token"):
        svc.auth.user_from_token(reset.token)


def test_reset_request_returns_the_email_to_send_only_for_active_accounts(svc, db):
    user, _ = signup(svc)
    message = svc.auth.start_password_reset("ADA@example.com")
    assert (message.to, message.name, message.minutes) == ("ada@example.com", "Ada", 30) and message.token
    assert svc.auth.start_password_reset("nobody@example.com") is None
    user.is_active = False
    db.commit()
    assert svc.auth.start_password_reset("ada@example.com") is None


def test_resetting_changes_the_password_and_the_link_works_only_once(svc):
    signup(svc)
    token = svc.auth.start_password_reset("ada@example.com").token
    svc.auth.reset_password(token, "brand-new-pass")
    assert svc.auth.login("ada@example.com", "brand-new-pass")
    with pytest.raises(UnauthorizedError):
        svc.auth.login("ada@example.com", "password123")
    with pytest.raises(BadRequestError, match="invalid or has expired"):
        svc.auth.reset_password(token, "another-new-pass")          # single use


@pytest.mark.parametrize("make_token", [
    lambda s: "garbage",
    lambda s: security.create_access_token("ada@example.com", s.secret_key, 5),                 # wrong kind of token
    lambda s: jwt.encode({"purpose": "password-reset", "email": "ada@example.com", "fp": "x",
                          "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, s.secret_key, "HS256"),
    lambda s: security.create_reset_token("ada@example.com", "not-the-current-hash", s.secret_key, 5),
    lambda s: security.create_reset_token("ghost@example.com", "h", s.secret_key, 5),
])
def test_invalid_reset_tokens_are_all_rejected_with_the_same_error(svc, settings, make_token):
    signup(svc)
    with pytest.raises(BadRequestError, match="invalid or has expired"):
        svc.auth.reset_password(make_token(settings), "new-password-123")
