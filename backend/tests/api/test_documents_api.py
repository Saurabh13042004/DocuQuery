import dataclasses

import pytest

from app.api import deps
from app.core.config import get_settings
from tests.helpers import make_pdf


def test_upload_returns_the_document_and_costs_two_credits(client, user, upload, fakes):
    doc = upload(user, name="Policy.pdf")
    assert set(doc) == {"id", "filename", "file_path", "upload_date", "team_id", "messages"}
    assert (doc["filename"], doc["team_id"], doc["messages"]) == ("Policy.pdf", None, [])
    assert client.get("/me", headers=user.headers).json()["credits"] == 18
    assert fakes.storage.files[doc["file_path"]] and fakes.vectors.for_document(doc["id"])


@pytest.mark.parametrize("filename,content,message", [
    ("notes.txt", b"just text", "Only PDF"),
    ("fake.pdf", b"<html>not a pdf</html>", "Only PDF"),
    ("empty.pdf", b"", "empty"),
    ("broken.pdf", b"%PDF-1.4 but not really", "couldn't be read"),
])
def test_uploads_are_validated_by_content_not_by_filename(client, user, filename, content, message):
    resp = client.post("/upload", headers=user.headers, files={"file": (filename, content, "application/pdf")})
    assert resp.status_code == 400 and message in resp.json()["detail"]
    assert client.get("/me", headers=user.headers).json()["credits"] == 20          # rejected uploads are free


def test_missing_file_is_a_422(client, user):
    assert client.post("/upload", headers=user.headers).status_code == 422


def test_oversized_uploads_are_413(client, user):
    small = dataclasses.replace(get_settings(), max_upload_mb=0)
    client.app.dependency_overrides[deps.get_settings] = lambda: small
    resp = client.post("/upload", headers=user.headers, files={"file": ("big.pdf", make_pdf("x"), "application/pdf")})
    assert resp.status_code == 413 and "limit" in resp.json()["detail"]


def test_running_out_of_credits_is_a_402_with_the_structured_detail_the_ui_reads(client, signup, upload):
    user = signup()
    for _ in range(10):
        upload(user)
    resp = client.post("/upload", headers=user.headers, files={"file": ("x.pdf", make_pdf("x"), "application/pdf")})
    assert resp.status_code == 402
    assert resp.json()["detail"] == {
        "error": "insufficient_credits", "credits_needed": 2, "credits_available": 0, "plan": "free",
        "message": "Not enough credits. 'upload' costs 2 credit(s) but you have 0.",
    }


def test_a_backend_failure_while_indexing_returns_502_and_charges_nothing(client, user, fakes):
    fakes.vectors.fail_upsert = RuntimeError("vector db down")
    resp = client.post("/upload", headers=user.headers, files={"file": ("x.pdf", make_pdf("some text"), "application/pdf")})
    assert resp.status_code == 502 and "not charged" in resp.json()["detail"]
    assert client.get("/me", headers=user.headers).json()["credits"] == 20 and client.get("/documents", headers=user.headers).json() == []


def test_documents_list_is_newest_first_and_private(client, signup, upload):
    a, b = signup(), signup()
    first, second = upload(a, name="first.pdf"), upload(a, name="second.pdf")
    upload(b, name="b.pdf")
    listed = client.get("/documents", headers=a.headers).json()
    assert [d["id"] for d in listed] == [second["id"], first["id"]]


def test_listing_includes_each_documents_chat_messages(client, user, upload):
    doc = upload(user)
    client.post(f"/documents/{doc['id']}/messages", headers=user.headers, json={"content": "hello", "is_user": True})
    listed = client.get("/documents", headers=user.headers).json()
    assert [m["content"] for m in listed[0]["messages"]] == ["hello"]


def test_file_endpoint_streams_the_pdf_privately(client, user, upload):
    doc = upload(user, text="Original text")
    resp = client.get(f"/documents/{doc['id']}/file", headers=user.headers)
    assert resp.status_code == 200 and resp.headers["content-type"] == "application/pdf"
    assert resp.headers["cache-control"] == "private, no-store" and resp.content[:5] == b"%PDF-"


def test_the_file_of_someone_elses_document_is_a_404_and_anonymous_access_a_401(client, signup, upload):
    owner, stranger = signup(), signup()
    doc = upload(owner)
    assert client.get(f"/documents/{doc['id']}/file", headers=stranger.headers).status_code == 404
    assert client.get(f"/documents/{doc['id']}/file").status_code == 401


def test_edited_flag_serves_the_latest_edit_and_falls_back_to_the_original(client, user, upload, fakes):
    doc = upload(user)
    assert client.get(f"/documents/{doc['id']}/file?edited=true", headers=user.headers).content == fakes.storage.files[doc["file_path"]]


def test_deleting_removes_the_document_and_its_file(client, user, upload, fakes):
    doc = upload(user)
    resp = client.delete(f"/documents/{doc['id']}", headers=user.headers)
    assert resp.status_code == 200 and resp.json() == {"message": "Document deleted"}
    assert client.get("/documents", headers=user.headers).json() == [] and doc["file_path"] not in fakes.storage.files
    assert client.delete(f"/documents/{doc['id']}", headers=user.headers).status_code == 404


def test_you_cannot_delete_someone_elses_document(client, signup, upload):
    owner, stranger = signup(), signup()
    doc = upload(owner)
    assert client.delete(f"/documents/{doc['id']}", headers=stranger.headers).status_code == 404
    assert len(client.get("/documents", headers=owner.headers).json()) == 1
