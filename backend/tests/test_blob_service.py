"""Upstash Blob storage: credential caching, object calls, and the authenticated file endpoint."""
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from app.services import blob_service
from tests.test_teams import make_user, upload


@pytest.fixture
def fresh_cache():
    blob_service._cache.update(s3=None, bucket=None, refresh_at=0.0)
    yield
    blob_service._cache.update(s3=None, bucket=None, refresh_at=0.0)


def _creds(expires_in=600):
    return {
        "accessKeyId": "ak", "secretAccessKey": "sk", "sessionToken": "st",
        "endpoint": "https://abc.r2.cloudflarestorage.com", "bucket": "bkt", "region": "auto",
        "expiresAt": time.time() + expires_in,
    }


def test_credentials_are_minted_once_then_cached(fresh_cache):
    with patch("app.services.blob_service.httpx.post") as post:
        post.return_value = MagicMock(json=lambda: _creds())
        blob_service._s3()
        _, bucket = blob_service._s3()
    assert post.call_count == 1 and bucket == "bkt"
    assert post.call_args.kwargs["headers"]["Authorization"] == "Bearer test-blob-token"


def test_credentials_refresh_shortly_before_expiry(fresh_cache):
    with patch("app.services.blob_service.httpx.post") as post:
        post.return_value = MagicMock(json=lambda: _creds(expires_in=10))  # inside the refresh margin
        blob_service._s3()
        blob_service._s3()
    assert post.call_count == 2


@pytest.mark.asyncio
async def test_put_get_delete_use_bucket_and_key():
    s3 = MagicMock()
    s3.get_object.return_value = {"Body": MagicMock(read=lambda: b"pdf-bytes")}
    with patch("app.services.blob_service._s3", return_value=(s3, "bkt")):
        await blob_service.put("docs/a.pdf", b"pdf-bytes")
        assert await blob_service.get("docs/a.pdf") == b"pdf-bytes"
        await blob_service.delete("docs/a.pdf")
    s3.put_object.assert_called_once_with(Bucket="bkt", Key="docs/a.pdf", Body=b"pdf-bytes", ContentType="application/pdf")
    s3.delete_object.assert_called_once_with(Bucket="bkt", Key="docs/a.pdf")


@pytest.mark.asyncio
async def test_get_missing_key_raises_file_not_found():
    s3 = MagicMock()
    s3.get_object.side_effect = ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
    with patch("app.services.blob_service._s3", return_value=(s3, "bkt")), pytest.raises(FileNotFoundError):
        await blob_service.get("docs/missing.pdf")


def test_file_endpoint_streams_pdf_only_to_people_with_access(client):
    _, owner = make_user(client)
    doc = upload(client, owner, shared=False).json()
    with patch("app.services.pdf_service.read_file", new_callable=AsyncMock, return_value=b"%PDF-bytes") as read:
        r = client.get(f"/documents/{doc['id']}/file", headers=owner)
        _, stranger = make_user(client)
        denied = client.get(f"/documents/{doc['id']}/file", headers=stranger)
        anon = client.get(f"/documents/{doc['id']}/file")
    assert r.status_code == 200 and r.content == b"%PDF-bytes" and r.headers["content-type"] == "application/pdf"
    read.assert_awaited_once_with("pdfs/a.pdf")  # the original, since no edit exists
    assert denied.status_code == 404 and anon.status_code in (401, 403)


def test_file_endpoint_serves_edited_version_and_404s_when_object_is_gone(client):
    from app import models
    from tests.conftest import TestingSession
    _, owner = make_user(client)
    doc = upload(client, owner, shared=False).json()
    s = TestingSession()
    s.query(models.Document).filter(models.Document.id == doc["id"]).update({"edited_file_path": "docs/edited_x.pdf"})
    s.commit(); s.close()

    with patch("app.services.pdf_service.read_file", new_callable=AsyncMock, return_value=b"edited") as read:
        client.get(f"/documents/{doc['id']}/file?edited=true", headers=owner)
    read.assert_awaited_once_with("docs/edited_x.pdf")

    with patch("app.services.pdf_service.read_file", new_callable=AsyncMock, side_effect=FileNotFoundError):
        assert client.get(f"/documents/{doc['id']}/file", headers=owner).status_code == 404


def test_delete_removes_blob_objects_and_comments(client):
    from app import models
    from tests.conftest import TestingSession
    _, owner = make_user(client)
    doc = upload(client, owner, shared=False).json()
    s = TestingSession()
    s.query(models.Document).filter(models.Document.id == doc["id"]).update(
        {"file_path": "docs/orig.pdf", "edited_file_path": "docs/edited_1.pdf"})
    s.commit(); s.close()
    client.post(f"/documents/{doc['id']}/comments", headers=owner, json={"content": "hi"})

    with patch("app.services.blob_service.delete", new_callable=AsyncMock) as delete:
        assert client.delete(f"/documents/{doc['id']}", headers=owner).status_code == 200
    assert {c.args[0] for c in delete.await_args_list} == {"docs/orig.pdf", "docs/edited_1.pdf"}
    s = TestingSession()
    assert s.query(models.Comment).filter(models.Comment.document_id == doc["id"]).count() == 0
    s.close()
