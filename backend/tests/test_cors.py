"""CORS must allow the real frontends and reject everything else."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _preflight(origin: str):
    return client.options(
        "/health",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )


@pytest.mark.parametrize("origin", [
    "http://localhost:3000",
    "https://docu-query-saurabh13042004s-projects.vercel.app",
    "https://docu-query.vercel.app",
    "https://docu-query-git-main-saurabh13042004s-projects.vercel.app",
])
def test_allowed_origins(origin):
    assert _preflight(origin).headers.get("access-control-allow-origin") == origin


@pytest.mark.parametrize("origin", [
    "https://evil.example.com",
    "https://docu-query.vercel.app.evil.com",
    "https://notdocu-query.vercel.app",
])
def test_other_origins_are_rejected(origin):
    assert "access-control-allow-origin" not in _preflight(origin).headers


def test_frontend_url_env_is_allowed(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://app.example.com/")
    monkeypatch.setenv("CORS_ORIGINS", "https://a.example.com, https://b.example.com")
    from importlib import reload
    import app.main as main
    reload(main)
    c = TestClient(main.app)
    for o in ("https://app.example.com", "https://a.example.com", "https://b.example.com"):
        r = c.options("/health", headers={"Origin": o, "Access-Control-Request-Method": "GET"})
        assert r.headers.get("access-control-allow-origin") == o
