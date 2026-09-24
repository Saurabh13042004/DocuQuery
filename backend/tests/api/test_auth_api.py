import pytest

from tests.helpers import unique_email

PROTECTED = [
    ("get", "/me"), ("get", "/plans"), ("post", "/upgrade-plan"), ("get", "/credits/history"),
    ("post", "/upload"), ("get", "/documents"), ("get", "/documents/1/file"), ("delete", "/documents/1"),
    ("post", "/ask"), ("get", "/documents/1/messages"), ("post", "/documents/1/messages"), ("get", "/documents/1/export"),
    ("get", "/teams/me"), ("post", "/teams"), ("get", "/teams/1/usage"), ("get", "/teams/1/prompts"),
    ("get", "/documents/1/comments"), ("patch", "/comments/1/resolve"),
]


def signup_body(**overrides):
    return {"name": "Ada Lovelace", "email": unique_email("ada"), "password": "password123", **overrides}


def test_signup_returns_a_token_and_the_new_user(client):
    body = signup_body(email="  Ada@Example.COM ")
    resp = client.post("/signup", json=body)
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_type"] == "bearer" and data["access_token"]
    assert set(data["user"]) == {"id", "name", "email", "is_active", "created_at", "credits", "plan"}
    assert (data["user"]["email"], data["user"]["credits"], data["user"]["plan"]) == ("ada@example.com", 20, "free")
    assert "hashed_password" not in data["user"] and "password" not in data["user"]


def test_duplicate_signup_is_a_400_with_a_readable_message(client):
    body = signup_body()
    client.post("/signup", json=body)
    resp = client.post("/signup", json={**body, "email": body["email"].upper()})
    assert resp.status_code == 400 and resp.json() == {"detail": "Email already registered"}


@pytest.mark.parametrize("bad", [
    {"name": ""}, {"name": "x" * 101}, {"email": "nope"}, {"email": ""}, {"password": "short"}, {"password": "x" * 129},
])
def test_signup_validates_its_input(client, bad):
    assert client.post("/signup", json=signup_body(**bad)).status_code == 422


def test_signup_needs_every_field(client):
    assert client.post("/signup", json={"email": unique_email()}).status_code == 422


def test_login_round_trip_and_the_token_works(client):
    body = signup_body()
    client.post("/signup", json=body)
    resp = client.post("/login", json={"email": body["email"].upper(), "password": "password123"})
    assert resp.status_code == 200
    me = client.get("/me", headers={"Authorization": f"Bearer {resp.json()['access_token']}"})
    assert me.status_code == 200 and me.json()["email"] == body["email"]


@pytest.mark.parametrize("password", ["wrong-password", "PASSWORD123"])
def test_wrong_credentials_are_401_with_a_bearer_challenge(client, password):
    body = signup_body()
    client.post("/signup", json=body)
    resp = client.post("/login", json={"email": body["email"], "password": password})
    assert resp.status_code == 401 and resp.json() == {"detail": "Incorrect email or password"}
    assert resp.headers["www-authenticate"] == "Bearer"


def test_unknown_email_gets_the_same_401_as_a_wrong_password(client):
    resp = client.post("/login", json={"email": "ghost@example.com", "password": "password123"})
    assert resp.status_code == 401 and resp.json() == {"detail": "Incorrect email or password"}


@pytest.mark.parametrize("method,path", PROTECTED)
def test_every_protected_route_requires_authentication(client, method, path):
    resp = getattr(client, method)(path)
    assert resp.status_code == 401 and resp.json() == {"detail": "Not authenticated"}


@pytest.mark.parametrize("header", ["Bearer not-a-real-token", "Basic abc", "Bearer "])
def test_bad_credentials_are_rejected(client, header):
    assert client.get("/me", headers={"Authorization": header}).status_code == 401


def test_password_reset_email_is_sent_only_for_real_accounts_but_the_answer_never_differs(client, user, fakes):
    known = client.post("/forgot-password", json={"email": user.email.upper()})
    unknown = client.post("/forgot-password", json={"email": "ghost@example.com"})
    assert known.status_code == unknown.status_code == 200 and known.json() == unknown.json()
    assert [m.to for m in fakes.mailer.sent] == [user.email]


def test_forgot_password_validates_the_email(client):
    assert client.post("/forgot-password", json={"email": "nope"}).status_code == 422


def test_full_password_reset_flow(client, user, fakes):
    client.post("/forgot-password", json={"email": user.email})
    token = fakes.mailer.sent[0].token

    assert client.post("/reset-password", json={"token": token, "password": "a-brand-new-password"}).status_code == 200
    assert client.post("/login", json={"email": user.email, "password": "a-brand-new-password"}).status_code == 200
    assert client.post("/login", json={"email": user.email, "password": "password123"}).status_code == 401
    replay = client.post("/reset-password", json={"token": token, "password": "yet-another-password"})
    assert replay.status_code == 400 and "invalid or has expired" in replay.json()["detail"]


def test_a_reset_token_is_useless_as_a_login_token_and_short_passwords_are_refused(client, user, fakes):
    client.post("/forgot-password", json={"email": user.email})
    token = fakes.mailer.sent[0].token
    assert client.get("/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401
    assert client.post("/reset-password", json={"token": token, "password": "short"}).status_code == 422
    assert client.post("/reset-password", json={"token": "garbage", "password": "long-enough-password"}).status_code == 400
