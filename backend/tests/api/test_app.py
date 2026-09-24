import pytest

from app.main import app, create_app
from fastapi.testclient import TestClient

EXPECTED_ROUTES = {
    ("POST", "/signup"), ("POST", "/login"), ("POST", "/forgot-password"), ("POST", "/reset-password"),
    ("GET", "/me"), ("GET", "/plans"), ("POST", "/upgrade-plan"), ("GET", "/credits/history"),
    ("POST", "/upload"), ("GET", "/documents"), ("GET", "/documents/{document_id}/file"), ("DELETE", "/documents/{document_id}"),
    ("POST", "/ask"), ("GET", "/documents/{document_id}/messages"), ("POST", "/documents/{document_id}/messages"),
    ("GET", "/documents/{document_id}/export"),
    ("GET", "/teams/me"), ("POST", "/teams"), ("POST", "/teams/{team_id}/invite"),
    ("POST", "/teams/invites/{invite_id}/accept"), ("DELETE", "/teams/invites/{invite_id}"),
    ("PATCH", "/teams/{team_id}/members/{member_id}"), ("DELETE", "/teams/{team_id}/members/{member_id}"),
    ("GET", "/teams/{team_id}/usage"), ("GET", "/teams/{team_id}/prompts"), ("POST", "/teams/{team_id}/prompts"),
    ("DELETE", "/teams/{team_id}/prompts/{prompt_id}"),
    ("GET", "/documents/{document_id}/comments"), ("POST", "/documents/{document_id}/comments"),
    ("PATCH", "/comments/{comment_id}/resolve"), ("GET", "/health"),
}


def test_the_public_api_surface_did_not_change():
    """The frontend is built against these routes; removing or renaming one must be deliberate."""
    actual = {(m.upper(), path) for path, ops in app.openapi()["paths"].items() for m in ops}
    assert actual == EXPECTED_ROUTES


def test_health_is_public(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_unknown_routes_are_404_and_errors_use_the_detail_envelope(client, user):
    assert client.get("/nope").status_code == 404
    resp = client.get("/documents/999999/messages", headers=user.headers)
    assert resp.status_code == 404 and resp.json() == {"detail": "Document not found"}


def test_validation_errors_use_fastapis_standard_422_shape(client, user):
    resp = client.post("/ask", headers=user.headers, json={"id": 1, "question": ""})
    assert resp.status_code == 422 and isinstance(resp.json()["detail"], list) and resp.json()["detail"][0]["loc"]


plain = TestClient(create_app(init_schema=False))


def preflight(origin):
    return plain.options("/health", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})


@pytest.mark.parametrize("origin", [
    "http://localhost:3000", "http://localhost:5173",
    "https://docu-query-saurabh13042004s-projects.vercel.app", "https://docu-query.vercel.app",
    "https://docu-query-git-main-saurabh13042004s-projects.vercel.app",
])
def test_the_real_frontends_are_allowed(origin):
    assert preflight(origin).headers.get("access-control-allow-origin") == origin


@pytest.mark.parametrize("origin", [
    "https://evil.example.com", "https://docu-query.vercel.app.evil.com", "https://notdocu-query.vercel.app",
    "http://docu-query.vercel.app",
])
def test_other_origins_are_refused(origin):
    assert "access-control-allow-origin" not in preflight(origin).headers
