import pymupdf as fitz
import pytest

from tests.fakes import tool


def ask(client, account, doc_id, question="What is the notice period?"):
    return client.post("/ask", headers=account.headers, json={"id": doc_id, "question": question})


def test_ask_returns_the_answer_citations_and_remaining_credits(client, user, upload, fakes):
    doc = upload(user)
    fakes.llm.will_return(tool("answer_question", response="Thirty days (page 1)."))
    resp = ask(client, user, doc["id"])
    assert resp.status_code == 200
    assert resp.json() == {"answer": "Thirty days (page 1).", "is_edit": False, "citations": ["1"], "credits_remaining": 17}


def test_an_answer_has_no_edited_url_field_at_all(client, user, upload):
    doc = upload(user)
    assert "editedPdfUrl" not in ask(client, user, doc["id"]).json()


def test_the_documents_own_chat_history_is_sent_to_the_model(client, user, upload, fakes):
    doc = upload(user)
    ask(client, user, doc["id"], "first question")
    ask(client, user, doc["id"], "second question")
    assert [m.content for m in fakes.llm.calls[1]["messages"] if m.role == "assistant"] == ["Fake answer"]


@pytest.mark.parametrize("payload", [
    {"id": 1, "question": ""}, {"id": 1, "question": "   "}, {"id": 1, "question": "x" * 4001},
    {"id": 0, "question": "hi"}, {"id": "abc", "question": "hi"}, {"question": "hi"}, {"id": 1},
])
def test_ask_validates_its_input(client, user, payload):
    assert client.post("/ask", headers=user.headers, json=payload).status_code == 422


def test_asking_about_a_missing_or_foreign_document_is_a_404(client, signup, upload):
    owner, stranger = signup(), signup()
    doc = upload(owner)
    assert ask(client, stranger, doc["id"]).status_code == 404
    assert ask(client, owner, 999999).status_code == 404


def test_asking_without_credits_is_a_402(client, signup, upload):
    user = signup()
    doc = upload(user)
    for _ in range(9):
        upload(user)            # burns the remaining credits
    assert ask(client, user, doc["id"]).status_code == 402


def test_an_edit_returns_a_url_that_serves_the_edited_pdf(client, user, upload, fakes):
    doc = upload(user, text="Employee: Ada Lovelace")
    fakes.llm.will_return(tool("edit_pdf", original_text="Ada", new_text="Grace"))
    resp = ask(client, user, doc["id"], "Change Ada to Grace")
    body = resp.json()
    assert resp.status_code == 200 and body["is_edit"] is True and body["credits_remaining"] == 15
    assert body["editedPdfUrl"].startswith(f"/documents/{doc['id']}/file?edited=true")

    edited = client.get(body["editedPdfUrl"], headers=user.headers)
    text = fitz.open(stream=edited.content, filetype="pdf")[0].get_text()
    assert "Grace" in text and "Ada" not in text
    original = client.get(f"/documents/{doc['id']}/file", headers=user.headers)
    assert "Ada" in fitz.open(stream=original.content, filetype="pdf")[0].get_text()      # the original is untouched


def test_messages_round_trip_in_order_with_validation(client, user, upload):
    doc = upload(user)
    url = f"/documents/{doc['id']}/messages"
    first = client.post(url, headers=user.headers, json={"content": "question", "is_user": True})
    client.post(url, headers=user.headers, json={"content": "answer", "is_user": False})
    assert first.status_code == 200 and set(first.json()) == {"id", "document_id", "content", "is_user", "timestamp"}
    assert [m["content"] for m in client.get(url, headers=user.headers).json()] == ["question", "answer"]
    assert client.post(url, headers=user.headers, json={"content": "", "is_user": True}).status_code == 422
    assert client.post(url, headers=user.headers, json={"content": "x"}).status_code == 422


def test_messages_are_private_to_the_document_owner(client, signup, upload):
    owner, stranger = signup(), signup()
    doc = upload(owner)
    url = f"/documents/{doc['id']}/messages"
    assert client.get(url, headers=stranger.headers).status_code == 404
    assert client.post(url, headers=stranger.headers, json={"content": "hi", "is_user": True}).status_code == 404


@pytest.mark.parametrize("fmt,media_type,suffix", [("md", "text/markdown", ".md"), ("txt", "text/plain", ".txt")])
def test_chat_export_downloads_as_an_attachment(client, user, upload, fmt, media_type, suffix):
    doc = upload(user, name="My Policy.pdf")
    client.post(f"/documents/{doc['id']}/messages", headers=user.headers, json={"content": "hello there", "is_user": True})
    resp = client.get(f"/documents/{doc['id']}/export?format={fmt}", headers=user.headers)
    assert resp.status_code == 200 and resp.headers["content-type"].startswith(media_type)
    assert resp.headers["content-disposition"] == f'attachment; filename="chat_My_Policy{suffix}"'
    assert "hello there" in resp.text and "My Policy.pdf" in resp.text


def test_export_defaults_to_markdown_and_rejects_unknown_formats(client, user, upload):
    doc = upload(user)
    assert client.get(f"/documents/{doc['id']}/export", headers=user.headers).headers["content-type"].startswith("text/markdown")
    assert client.get(f"/documents/{doc['id']}/export?format=pdf", headers=user.headers).status_code == 422
