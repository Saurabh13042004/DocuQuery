import pytest

from tests.fakes import tool
from tests.helpers import make_pdf

__all__ = ["tool", "make_pdf"]


@pytest.fixture
def upload(client):
    """upload(account, shared=False, text=...) -> the created document (JSON)."""
    def _upload(account, shared: bool = False, text: str = "The notice period is thirty days.", name: str = "doc.pdf"):
        resp = client.post(
            "/upload", headers=account.headers, data={"shared": str(shared).lower()},
            files={"file": (name, make_pdf(text), "application/pdf")},
        )
        assert resp.status_code == 200, resp.text
        return resp.json()
    return _upload


@pytest.fixture
def team(client, signup):
    """An owner on the Team plan with a workspace, plus a join(role) helper for extra members."""
    owner = signup(plan="team")
    team_id = client.post("/teams", headers=owner.headers, json={"name": "Acme"}).json()["id"]

    def join(role: str = "editor"):
        member = signup()
        invite = client.post(f"/teams/{team_id}/invite", headers=owner.headers, json={"email": member.email, "role": role})
        assert invite.status_code == 200, invite.text
        pending = client.get("/teams/me", headers=member.headers).json()["pending_invites"][0]
        assert client.post(f"/teams/invites/{pending['id']}/accept", headers=member.headers).status_code == 200
        return member

    class Team:
        id = team_id
    Team.owner, Team.join = owner, staticmethod(join)
    return Team
