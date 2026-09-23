"""Team plan: workspaces, roles, shared documents, prompts, comments."""
import itertools
from unittest.mock import AsyncMock, patch

_n = itertools.count()


def make_user(client, plan=None):
    email = f"team{next(_n)}@example.com"
    r = client.post("/signup", json={"name": email.split("@")[0], "email": email, "password": "password123"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    if plan:
        assert client.post("/upgrade-plan", headers=h, json={"plan": plan}).status_code == 200
    return email, h


def upload(client, headers, shared=True, name="a.pdf"):
    with patch("app.services.pdf_service.save_pdf", new_callable=AsyncMock, return_value="pdfs/a.pdf"), \
         patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock, return_value="text"), \
         patch("app.services.pdf_service.extract_pages", new_callable=AsyncMock, return_value=["text"]), \
         patch("app.services.vector_service.index_document", new_callable=AsyncMock, return_value=1):
        return client.post("/upload", headers=headers, data={"shared": str(shared).lower()},
                           files={"file": (name, b"%PDF-1.4", "application/pdf")})


def make_team(client, roles=("editor", "viewer")):
    """Owner on Team plan + one accepted member per role. Returns (team_id, owner_headers, {role: headers})."""
    _, owner = make_user(client, plan="team")
    team_id = client.post("/teams", headers=owner, json={"name": "Acme"}).json()["id"]
    members = {}
    for role in roles:
        email, h = make_user(client)
        assert client.post(f"/teams/{team_id}/invite", headers=owner, json={"email": email.upper(), "role": role}).status_code == 200
        invite = client.get("/teams/me", headers=h).json()["pending_invites"][0]
        assert client.post(f"/teams/invites/{invite['id']}/accept", headers=h).status_code == 200
        members[role] = h
    return team_id, owner, members


def test_create_team_requires_team_plan(client):
    _, h = make_user(client)
    assert client.post("/teams", headers=h, json={"name": "X"}).status_code == 403


def test_invite_accept_grants_seat_credits_and_lists_members(client):
    team_id, owner, members = make_team(client, roles=("editor",))
    me = client.get("/me", headers=members["editor"]).json()
    assert me["credits"] == 20 + 1500
    team = client.get("/teams/me", headers=owner).json()["team"]
    assert team["role"] == "owner" and {m["role"] for m in team["members"]} == {"owner", "editor"}


def test_seat_limit(client):
    team_id, owner, _ = make_team(client, roles=("editor", "editor", "editor", "editor"))
    assert client.post(f"/teams/{team_id}/invite", headers=owner, json={"email": "x@y.com"}).status_code == 400


def test_only_invited_email_can_accept(client):
    _, owner = make_user(client, plan="team")
    team_id = client.post("/teams", headers=owner, json={"name": "T"}).json()["id"]
    email, invitee = make_user(client)
    inv = client.post(f"/teams/{team_id}/invite", headers=owner, json={"email": email}).json()
    _, other = make_user(client)
    assert client.post(f"/teams/invites/{inv['id']}/accept", headers=other).status_code == 404


def test_shared_docs_visible_to_team_only(client):
    team_id, owner, m = make_team(client)
    doc = upload(client, m["editor"]).json()
    assert doc["team_id"] == team_id
    for h in (owner, m["viewer"], m["editor"]):
        assert doc["id"] in [d["id"] for d in client.get("/documents", headers=h).json()]
    _, outsider = make_user(client)
    assert client.get(f"/documents/{doc['id']}/messages", headers=outsider).status_code == 404


def test_personal_docs_stay_private(client):
    _, owner, m = make_team(client)
    doc = upload(client, m["editor"], shared=False).json()
    assert doc["team_id"] is None
    assert client.get(f"/documents/{doc['id']}/messages", headers=owner).status_code == 404


def test_viewer_cannot_upload_and_cannot_delete(client):
    _, owner, m = make_team(client)
    assert upload(client, m["viewer"]).status_code == 403
    doc = upload(client, m["editor"]).json()
    assert client.delete(f"/documents/{doc['id']}", headers=m["viewer"]).status_code == 403


def test_editor_deletes_own_only_admin_deletes_any(client):
    _, owner, m = make_team(client)
    owners_doc = upload(client, owner).json()
    assert client.delete(f"/documents/{owners_doc['id']}", headers=m["editor"]).status_code == 403
    editors_doc = upload(client, m["editor"]).json()
    assert client.delete(f"/documents/{editors_doc['id']}", headers=owner).status_code == 200
    another = upload(client, m["editor"]).json()
    assert client.delete(f"/documents/{another['id']}", headers=m["editor"]).status_code == 200


def test_viewer_can_chat_but_edit_is_blocked(client):
    from unittest.mock import MagicMock
    _, owner, m = make_team(client)
    doc = upload(client, owner).json()
    tc = MagicMock()
    tc.function.name, tc.function.arguments = "edit_pdf", '{"original_text": "a", "new_text": "b"}'
    resp = MagicMock(choices=[MagicMock(message=MagicMock(tool_calls=[tc], content=None))])
    with patch("app.services.pdf_service._client") as c, \
         patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock, return_value="a"), \
         patch("app.services.vector_service.query_relevant_chunks", new_callable=AsyncMock,
               return_value={"context": "a", "pages": []}):
        c.chat.completions.create.return_value = resp
        r = client.post("/ask", headers=m["viewer"], json={"id": doc["id"], "question": "change a to b"})
    assert r.status_code == 200 and r.json()["is_edit"] is False and "view-only" in r.json()["answer"]


def test_role_management_and_usage_permissions(client):
    team_id, owner, m = make_team(client)
    editor_id = next(x["user_id"] for x in client.get("/teams/me", headers=owner).json()["team"]["members"] if x["role"] == "editor")
    assert client.get(f"/teams/{team_id}/usage", headers=m["editor"]).status_code == 403
    assert client.patch(f"/teams/{team_id}/members/{editor_id}", headers=m["viewer"], json={"role": "admin"}).status_code == 403
    assert client.patch(f"/teams/{team_id}/members/{editor_id}", headers=owner, json={"role": "admin"}).status_code == 200
    usage = client.get(f"/teams/{team_id}/usage", headers=m["editor"]).json()  # now admin
    assert len(usage["members"]) == 3
    assert client.delete(f"/teams/{team_id}/members/{editor_id}", headers=owner).status_code == 200
    assert client.get("/teams/me", headers=m["editor"]).json()["team"] is None


def test_shared_prompts_admin_publish_members_read(client):
    team_id, owner, m = make_team(client)
    body = {"title": "Summarise", "prompt": "Summarise this", "category": "Legal"}
    assert client.post(f"/teams/{team_id}/prompts", headers=m["editor"], json=body).status_code == 403
    assert client.post(f"/teams/{team_id}/prompts", headers=owner, json={**body, "category": "Nope"}).status_code == 400
    assert client.post(f"/teams/{team_id}/prompts", headers=owner, json=body).status_code == 200
    assert client.get(f"/teams/{team_id}/prompts", headers=m["viewer"]).json()[0]["category"] == "Legal"


def test_comments_thread_and_resolve(client):
    _, owner, m = make_team(client)
    doc = upload(client, owner).json()
    c = client.post(f"/documents/{doc['id']}/comments", headers=m["viewer"], json={"content": "Check p2", "page": 2}).json()
    assert c["resolved"] is False and c["page"] == 2
    assert client.patch(f"/comments/{c['id']}/resolve", headers=owner).json()["resolved"] is True
    assert len(client.get(f"/documents/{doc['id']}/comments", headers=owner).json()) == 1
    _, outsider = make_user(client)
    assert client.get(f"/documents/{doc['id']}/comments", headers=outsider).status_code == 404
