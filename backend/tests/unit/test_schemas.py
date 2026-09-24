import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, ResetPasswordRequest, SignupRequest
from app.schemas.documents import MessageCreate, QuestionRequest
from app.schemas.teams import CommentCreate, PromptCreate, RoleUpdate, TeamCreate, TeamInviteRequest


def test_signup_normalises_name_and_email():
    s = SignupRequest(name="  Ada Lovelace  ", email="  Ada@Example.COM ", password="password123")
    assert s.name == "Ada Lovelace" and s.email == "ada@example.com"


@pytest.mark.parametrize("bad", [
    dict(name="", email="a@b.co", password="password123"),
    dict(name="x" * 101, email="a@b.co", password="password123"),
    dict(name="Ada", email="not-an-email", password="password123"),
    dict(name="Ada", email="a@b", password="password123"),
    dict(name="Ada", email="a b@c.co", password="password123"),
    dict(name="Ada", email="a@b.co", password="short"),
    dict(name="Ada", email="a@b.co", password="x" * 129),
])
def test_signup_rejects_invalid_input(bad):
    with pytest.raises(ValidationError):
        SignupRequest(**bad)


def test_login_only_requires_a_non_empty_password():
    assert LoginRequest(email="A@B.co", password="x").email == "a@b.co"  # legacy short passwords still work
    with pytest.raises(ValidationError):
        LoginRequest(email="a@b.co", password="")


def test_reset_password_enforces_the_minimum_length():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="t", password="short")


def test_question_is_trimmed_and_bounded():
    assert QuestionRequest(question="  hi  ", id=1).question == "hi"
    for bad in ("", "   ", "x" * 4001):
        with pytest.raises(ValidationError):
            QuestionRequest(question=bad, id=1)
    with pytest.raises(ValidationError):
        QuestionRequest(question="ok", id=0)


def test_message_content_is_required_and_bounded():
    with pytest.raises(ValidationError):
        MessageCreate(content="", is_user=True)
    with pytest.raises(ValidationError):
        MessageCreate(content="x" * 50_001, is_user=False)


def test_roles_and_categories_are_closed_sets():
    assert TeamInviteRequest(email="a@b.co").role.value == "editor"  # default
    for bad_role in ("owner", "superuser", ""):
        with pytest.raises(ValidationError):
            RoleUpdate(role=bad_role)
    with pytest.raises(ValidationError):
        PromptCreate(title="t", prompt="p", category="Sales")
    assert PromptCreate(title="t", prompt="p").category.value == "General"


def test_team_and_comment_bounds():
    with pytest.raises(ValidationError):
        TeamCreate(name="   ")
    with pytest.raises(ValidationError):
        CommentCreate(content="ok", page=0)
    with pytest.raises(ValidationError):
        CommentCreate(content="x" * 2001)
    assert CommentCreate(content=" hi ", page=None).content == "hi"
