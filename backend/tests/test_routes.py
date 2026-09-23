"""Integration tests for the FastAPI routes (uses SQLite in-memory via conftest)."""
import io
import json
import pytest
import pymupdf as fitz
from unittest.mock import AsyncMock, MagicMock, patch


# ── helpers ───────────────────────────────────────────────────────────────────

def make_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 100), "Test PDF content for DocuQuery", fontsize=12)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def openai_tool_response(name: str, args: dict):
    """Build a mock OpenAI chat completion that calls the given tool."""
    tc = MagicMock()
    tc.function.name = name
    tc.function.arguments = json.dumps(args)
    message = MagicMock(tool_calls=[tc], content=None)
    return MagicMock(choices=[MagicMock(message=message)])


def openai_answer_response(text: str):
    return openai_tool_response("answer_question", {"response": text})


def openai_edit_response(original: str, new: str):
    return openai_tool_response("edit_pdf", {"original_text": original, "new_text": new})


# ── auth routes ───────────────────────────────────────────────────────────────

class TestSignup:
    def test_signup_success(self, client):
        resp = client.post("/signup", json={
            "name": "John Doe",
            "email": "john@example.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == "john@example.com"

    def test_signup_returns_user_name(self, client):
        resp = client.post("/signup", json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "password123",
        })
        assert resp.json()["user"]["name"] == "Jane Doe"

    def test_signup_duplicate_email_returns_400(self, client):
        payload = {"name": "Alice", "email": "alice2@example.com", "password": "pass123"}
        client.post("/signup", json=payload)
        resp = client.post("/signup", json=payload)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"]

    def test_signup_missing_fields_returns_422(self, client):
        resp = client.post("/signup", json={"name": "Bob"})
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        client.post("/signup", json={
            "name": "LoginUser",
            "email": "loginuser@example.com",
            "password": "mypassword",
        })
        resp = client.post("/login", json={
            "email": "loginuser@example.com",
            "password": "mypassword",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password_returns_401(self, client):
        client.post("/signup", json={
            "name": "WrongPass",
            "email": "wrongpass@example.com",
            "password": "correct",
        })
        resp = client.post("/login", json={
            "email": "wrongpass@example.com",
            "password": "incorrect",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user_returns_401(self, client):
        resp = client.post("/login", json={
            "email": "nobody@example.com",
            "password": "any",
        })
        assert resp.status_code == 401

    def test_login_missing_fields_returns_422(self, client):
        resp = client.post("/login", json={"email": "x@x.com"})
        assert resp.status_code == 422


# ── document routes ───────────────────────────────────────────────────────────

class TestGetDocuments:
    def test_requires_auth(self, client):
        resp = client.get("/documents")
        assert resp.status_code == 403

    def test_returns_empty_list_for_new_user(self, client, auth_headers):
        resp = client.get("/documents", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_invalid_token_returns_401(self, client):
        resp = client.get("/documents", headers={"Authorization": "Bearer bad.token.here"})
        assert resp.status_code == 401


class TestUploadPdf:
    def test_upload_returns_document(self, client, auth_headers):
        pdf_bytes = make_pdf_bytes()

        with patch("app.services.pdf_service.save_pdf", new_callable=AsyncMock) as mock_save, \
             patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as mock_extract, \
             patch("app.services.vector_service.index_document", new_callable=AsyncMock) as mock_index:

            mock_save.return_value = "pdfs/test.pdf"
            mock_extract.return_value = "Test PDF content"
            mock_index.return_value = 1

            resp = client.post(
                "/upload",
                headers=auth_headers,
                files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["filename"] == "test.pdf"
        assert "id" in body

    def test_upload_requires_auth(self, client):
        resp = client.post(
            "/upload",
            files={"file": ("test.pdf", b"fake", "application/pdf")},
        )
        assert resp.status_code == 403

    def test_upload_document_appears_in_list(self, client, auth_headers):
        pdf_bytes = make_pdf_bytes()

        with patch("app.services.pdf_service.save_pdf", new_callable=AsyncMock) as mock_save, \
             patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as mock_extract, \
             patch("app.services.vector_service.index_document", new_callable=AsyncMock) as mock_index:

            mock_save.return_value = "pdfs/test2.pdf"
            mock_extract.return_value = "content"
            mock_index.return_value = 1

            client.post(
                "/upload",
                headers=auth_headers,
                files={"file": ("test2.pdf", pdf_bytes, "application/pdf")},
            )

        resp = client.get("/documents", headers=auth_headers)
        assert resp.status_code == 200
        filenames = [d["filename"] for d in resp.json()]
        assert "test2.pdf" in filenames


class TestDeleteDocument:
    def _upload(self, client, auth_headers):
        pdf_bytes = make_pdf_bytes()
        with patch("app.services.pdf_service.save_pdf", new_callable=AsyncMock) as mock_save, \
             patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as mock_extract, \
             patch("app.services.vector_service.index_document", new_callable=AsyncMock) as mock_index:
            mock_save.return_value = "pdfs/del.pdf"
            mock_extract.return_value = "content"
            mock_index.return_value = 1
            resp = client.post(
                "/upload",
                headers=auth_headers,
                files={"file": ("del.pdf", pdf_bytes, "application/pdf")},
            )
        return resp.json()["id"]

    def test_delete_returns_success_message(self, client, auth_headers, mock_redis):
        doc_id = self._upload(client, auth_headers)
        resp = client.delete(f"/documents/{doc_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["message"] == "Document deleted"

    def test_delete_clears_redis_history(self, client, auth_headers, mock_redis):
        doc_id = self._upload(client, auth_headers)
        client.delete(f"/documents/{doc_id}", headers=auth_headers)
        mock_redis.delete.assert_called_with(f"chat:{doc_id}")

    def test_delete_nonexistent_returns_404(self, client, auth_headers):
        resp = client.delete("/documents/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_requires_auth(self, client):
        resp = client.delete("/documents/1")
        assert resp.status_code == 403


# ── ask route ─────────────────────────────────────────────────────────────────

class TestAskQuestion:
    def _upload_and_get_doc(self, client, auth_headers):
        pdf_bytes = make_pdf_bytes()
        with patch("app.services.pdf_service.save_pdf", new_callable=AsyncMock) as mock_save, \
             patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as mock_extract, \
             patch("app.services.vector_service.index_document", new_callable=AsyncMock) as mock_index:
            mock_save.return_value = "pdfs/ask.pdf"
            mock_extract.return_value = "Document with key content."
            mock_index.return_value = 1
            resp = client.post(
                "/upload",
                headers=auth_headers,
                files={"file": ("ask.pdf", pdf_bytes, "application/pdf")},
            )
        return resp.json()

    def test_ask_question_returns_answer(self, client, auth_headers, mock_redis):
        doc = self._upload_and_get_doc(client, auth_headers)
        mock_redis.lrange.return_value = []

        with patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as mock_extract, \
             patch("app.services.vector_service.query_relevant_chunks", new_callable=AsyncMock) as mock_rag, \
             patch("app.services.pdf_service._client") as mock_openai:

            mock_extract.return_value = "Document with key content."
            mock_rag.return_value = "Key content found here."
            mock_openai.chat.completions.create.return_value = openai_answer_response("The answer is 42.")

            resp = client.post("/ask", headers=auth_headers, json={
                "question": "What is the answer?",
                "id": doc["id"],
            })

        assert resp.status_code == 200
        body = resp.json()
        assert body["answer"] == "The answer is 42."
        assert body["is_edit"] is False

    def test_ask_nonexistent_document_returns_404(self, client, auth_headers):
        resp = client.post("/ask", headers=auth_headers, json={
            "question": "anything",
            "id": 99999,
        })
        assert resp.status_code == 404

    def test_ask_requires_auth(self, client):
        resp = client.post("/ask", json={"question": "anything", "id": 1})
        assert resp.status_code == 403

    def test_ask_edit_request_returns_is_edit_true(self, client, auth_headers, mock_redis, tmp_path):
        import os
        doc = self._upload_and_get_doc(client, auth_headers)
        mock_redis.lrange.return_value = []

        # Create a real PDF so _perform_pdf_edit can run
        pdf_path = str(tmp_path / "ask_edit.pdf")
        fitz_doc = fitz.open()
        p = fitz_doc.new_page()
        p.insert_text((72, 100), "Name: Saurabh Shukla", fontsize=12)
        fitz_doc.save(pdf_path)
        fitz_doc.close()

        # Point the document's file_path to our test PDF
        from tests.conftest import TestingSession
        session = TestingSession()
        from app import models
        db_doc = session.query(models.Document).filter(models.Document.id == doc["id"]).first()
        db_doc.file_path = pdf_path
        session.commit()
        session.close()

        with patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as mock_extract, \
             patch("app.services.vector_service.query_relevant_chunks", new_callable=AsyncMock) as mock_rag, \
             patch("app.services.pdf_service._client") as mock_openai, \
             patch("app.services.pdf_service.os.makedirs"):

            mock_extract.return_value = "Name: Saurabh Shukla"
            mock_rag.return_value = "Name: Saurabh Shukla"
            mock_openai.chat.completions.create.return_value = openai_edit_response("Saurabh", "Rishabh")

            resp = client.post("/ask", headers=auth_headers, json={
                "question": "Change Saurabh to Rishabh",
                "id": doc["id"],
            })

        assert resp.status_code == 200
        body = resp.json()
        assert body["is_edit"] is True
        assert "editedPdfUrl" in body


# ── message routes ────────────────────────────────────────────────────────────

class TestMessages:
    def _get_doc_id(self, client, auth_headers):
        pdf_bytes = make_pdf_bytes()
        with patch("app.services.pdf_service.save_pdf", new_callable=AsyncMock) as ms, \
             patch("app.services.pdf_service.extract_text_from_pdf", new_callable=AsyncMock) as me, \
             patch("app.services.vector_service.index_document", new_callable=AsyncMock) as mi:
            ms.return_value = "pdfs/msg.pdf"
            me.return_value = "content"
            mi.return_value = 1
            resp = client.post(
                "/upload",
                headers=auth_headers,
                files={"file": ("msg.pdf", pdf_bytes, "application/pdf")},
            )
        return resp.json()["id"]

    def test_add_message_user(self, client, auth_headers):
        doc_id = self._get_doc_id(client, auth_headers)
        resp = client.post(
            f"/documents/{doc_id}/messages",
            headers=auth_headers,
            json={"content": "Hello, assistant!", "is_user": True},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["content"] == "Hello, assistant!"
        assert body["is_user"] is True
        assert body["document_id"] == doc_id

    def test_add_message_assistant(self, client, auth_headers):
        doc_id = self._get_doc_id(client, auth_headers)
        resp = client.post(
            f"/documents/{doc_id}/messages",
            headers=auth_headers,
            json={"content": "I am an AI.", "is_user": False},
        )
        assert resp.status_code == 200
        assert resp.json()["is_user"] is False

    def test_get_messages_empty(self, client, auth_headers):
        doc_id = self._get_doc_id(client, auth_headers)
        resp = client.get(f"/documents/{doc_id}/messages", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_messages_returns_added(self, client, auth_headers):
        doc_id = self._get_doc_id(client, auth_headers)
        client.post(
            f"/documents/{doc_id}/messages",
            headers=auth_headers,
            json={"content": "First message", "is_user": True},
        )
        resp = client.get(f"/documents/{doc_id}/messages", headers=auth_headers)
        assert resp.status_code == 200
        messages = resp.json()
        assert len(messages) == 1
        assert messages[0]["content"] == "First message"

    def test_get_messages_ordered_by_timestamp(self, client, auth_headers):
        doc_id = self._get_doc_id(client, auth_headers)
        for i in range(3):
            client.post(
                f"/documents/{doc_id}/messages",
                headers=auth_headers,
                json={"content": f"Message {i}", "is_user": True},
            )
        resp = client.get(f"/documents/{doc_id}/messages", headers=auth_headers)
        messages = resp.json()
        assert len(messages) == 3
        contents = [m["content"] for m in messages]
        assert contents == ["Message 0", "Message 1", "Message 2"]

    def test_add_message_to_nonexistent_doc_returns_404(self, client, auth_headers):
        resp = client.post(
            "/documents/99999/messages",
            headers=auth_headers,
            json={"content": "ghost", "is_user": True},
        )
        assert resp.status_code == 404

    def test_get_messages_for_nonexistent_doc_returns_404(self, client, auth_headers):
        resp = client.get("/documents/99999/messages", headers=auth_headers)
        assert resp.status_code == 404

    def test_messages_require_auth(self, client):
        resp = client.get("/documents/1/messages")
        assert resp.status_code == 403
