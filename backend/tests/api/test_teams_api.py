import pytest

from tests.fakes import tool


def test_creating_a_workspace_needs_the_team_plan(client, signup):
    resp = client.post("/teams", headers=signup().headers, json={"name": "Acme"})
    assert resp.status_code == 403 and "Team plan" in resp.json()["detail"]


def test_team_names_are_validated(client, signup):
    owner = signup(plan="team")
    for bad in ({"name": ""}, {"name": "   "}, {"name": "x" * 101}, {}):
        assert client.post("/teams", headers=owner.headers, json=bad).status_code == 422


def test_my_team_shows_the_workspace_members_and_seat_count(client, team):
    member = team.join("editor")
    data = client.get("/teams/me", headers=member.headers).json()
    assert data["pending_invites"] == [] and data["team"]["name"] == "Acme" and data["team"]["seats"] == 5
    assert data["team"]["role"] == "editor" and data["team"]["invites"] == []
    assert {(m["role"], m["email"]) for m in data["team"]["members"]} == {("owner", team.owner.email), ("editor", member.email)}


def test_a_user_outside_any_team_sees_null(client, user):
    assert client.get("/teams/me", headers=user.headers).json() == {"team": None, "pending_invites": []}


def test_invited_users_see_the_invite_and_get_seat_credits_on_accepting(client, team, signup):
    guest = signup()
    resp = client.post(f"/teams/{team.id}/invite", headers=team.owner.headers, json={"email": guest.email.upper(), "role": "viewer"})
    assert resp.status_code == 200 and set(resp.json()) == {"id", "email", "role"}
    pending = client.get("/teams/me", headers=guest.headers).json()["pending_invites"]
    assert pending == [{"id": resp.json()["id"], "team_name": "Acme", "role": "viewer"}]
    assert client.post(f"/teams/invites/{pending[0]['id']}/accept", headers=guest.headers).json() == {"message": "Joined team"}
    assert client.get("/me", headers=guest.headers).json()["credits"] == 20 + 1500


@pytest.mark.parametrize("payload", [{"email": "nope"}, {"email": "a@b.co", "role": "owner"}, {"email": "a@b.co", "role": "root"}, {}])
def test_invites_are_validated(client, team, payload):
    assert client.post(f"/teams/{team.id}/invite", headers=team.owner.headers, json=payload).status_code == 422


def test_seat_limit_and_role_rules(client, team, signup):
    editor = team.join("editor")
    assert client.post(f"/teams/{team.id}/invite", headers=editor.headers, json={"email": "x@y.co"}).status_code == 403
    for _ in range(3):
        team.join("viewer")                                              # owner + editor + 3 viewers = 5 seats
    full = client.post(f"/teams/{team.id}/invite", headers=team.owner.headers, json={"email": signup().email})
    assert full.status_code == 400 and "seats" in full.json()["detail"]


def test_roles_can_be_changed_and_members_removed_by_the_owner_only_within_the_rules(client, team):
    editor, viewer = team.join("editor"), team.join("viewer")
    url = f"/teams/{team.id}/members/{editor.id}"
    assert client.patch(url, headers=viewer.headers, json={"role": "admin"}).status_code == 403
    changed = client.patch(url, headers=team.owner.headers, json={"role": "admin"})
    assert changed.status_code == 200 and changed.json() == {"user_id": editor.id, "role": "admin"}
    assert client.patch(url, headers=team.owner.headers, json={"role": "owner"}).status_code == 422
    assert client.delete(f"/teams/{team.id}/members/{viewer.id}", headers=team.owner.headers).status_code == 200
    assert client.get("/teams/me", headers=viewer.headers).json()["team"] is None


def test_members_can_leave_but_the_owner_cannot(client, team):
    editor = team.join()
    assert client.delete(f"/teams/{team.id}/members/{team.owner.id}", headers=team.owner.headers).status_code == 400
    assert client.delete(f"/teams/{team.id}/members/{editor.id}", headers=editor.headers).status_code == 200


def test_usage_dashboard_is_for_managers(client, team):
    editor = team.join()
    assert client.get(f"/teams/{team.id}/usage", headers=editor.headers).status_code == 403
    usage = client.get(f"/teams/{team.id}/usage", headers=team.owner.headers).json()["members"]
    assert len(usage) == 2 and set(usage[0]) == {"user_id", "name", "email", "role", "credits_used", "docs_uploaded", "last_active"}


def test_shared_documents_are_visible_to_the_whole_team_but_personal_ones_are_not(client, team, upload):
    editor, viewer = team.join("editor"), team.join("viewer")
    shared = upload(editor, shared=True)
    private = upload(editor, shared=False)
    assert shared["team_id"] == team.id and private["team_id"] is None
    for account in (team.owner, viewer, editor):
        assert shared["id"] in [d["id"] for d in client.get("/documents", headers=account.headers).json()]
    assert private["id"] not in [d["id"] for d in client.get("/documents", headers=team.owner.headers).json()]
    assert client.get(f"/documents/{private['id']}/messages", headers=team.owner.headers).status_code == 404


def test_viewers_can_read_and_chat_but_not_upload_edit_or_delete(client, team, upload, fakes):
    editor, viewer = team.join("editor"), team.join("viewer")
    doc = upload(editor, shared=True, text="Employee: Ada Lovelace")
    upload_resp = client.post("/upload", headers=viewer.headers, files={"file": ("x.pdf", b"%PDF-1.4", "application/pdf")})
    assert upload_resp.status_code == 403 and "Viewers" in upload_resp.json()["detail"]
    assert client.delete(f"/documents/{doc['id']}", headers=viewer.headers).status_code == 403

    fakes.llm.will_return(tool("edit_pdf", original_text="Ada", new_text="Eve"))
    asked = client.post("/ask", headers=viewer.headers, json={"id": doc["id"], "question": "change Ada to Eve"})
    assert asked.status_code == 200 and asked.json()["is_edit"] is False and "view-only" in asked.json()["answer"]


def test_editors_delete_only_their_own_documents_admins_delete_any(client, team, upload):
    editor, other = team.join("editor"), team.join("editor")
    mine, theirs = upload(editor, shared=True), upload(other, shared=True)
    assert client.delete(f"/documents/{theirs['id']}", headers=editor.headers).status_code == 403
    assert client.delete(f"/documents/{mine['id']}", headers=editor.headers).status_code == 200
    assert client.delete(f"/documents/{theirs['id']}", headers=team.owner.headers).status_code == 200


def test_shared_prompts(client, team):
    editor = team.join()
    body = {"title": "Summarise", "prompt": "Summarise this contract", "category": "Legal"}
    assert client.post(f"/teams/{team.id}/prompts", headers=editor.headers, json=body).status_code == 403
    assert client.post(f"/teams/{team.id}/prompts", headers=team.owner.headers, json={**body, "category": "Sales"}).status_code == 422
    created = client.post(f"/teams/{team.id}/prompts", headers=team.owner.headers, json=body)
    assert created.status_code == 200 and set(created.json()) == {"id", "title", "prompt", "category"}
    assert client.get(f"/teams/{team.id}/prompts", headers=editor.headers).json()[0]["category"] == "Legal"
    assert client.delete(f"/teams/{team.id}/prompts/{created.json()['id']}", headers=team.owner.headers).status_code == 200
    assert client.get(f"/teams/{team.id}/prompts", headers=editor.headers).json() == []


def test_comments_thread_resolve_and_validation(client, team, upload, signup):
    viewer = team.join("viewer")
    doc = upload(team.owner, shared=True)
    url = f"/documents/{doc['id']}/comments"
    made = client.post(url, headers=viewer.headers, json={"content": "Check clause 4", "page": 2})
    assert made.status_code == 200 and set(made.json()) == {"id", "user_name", "content", "page", "resolved", "created_at"}
    assert made.json()["resolved"] is False and made.json()["page"] == 2
    assert client.patch(f"/comments/{made.json()['id']}/resolve", headers=team.owner.headers).json()["resolved"] is True
    assert len(client.get(url, headers=team.owner.headers).json()) == 1
    for bad in ({"content": ""}, {"content": "ok", "page": 0}, {"content": "x" * 2001}):
        assert client.post(url, headers=viewer.headers, json=bad).status_code == 422
    assert client.get(url, headers=signup().headers).status_code == 404


def test_deleting_a_document_with_comments_and_messages_works(client, user, upload):
    doc = upload(user)
    client.post(f"/documents/{doc['id']}/comments", headers=user.headers, json={"content": "note"})
    client.post(f"/documents/{doc['id']}/messages", headers=user.headers, json={"content": "hi", "is_user": True})
    assert client.delete(f"/documents/{doc['id']}", headers=user.headers).status_code == 200
