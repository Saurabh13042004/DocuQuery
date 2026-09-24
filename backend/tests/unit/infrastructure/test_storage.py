import time
from unittest.mock import MagicMock, patch

import httpx
import pytest
from botocore.exceptions import ClientError

from app.infrastructure.storage import legacy
from app.infrastructure.storage.blob import PREFIX, REFRESH_MARGIN_S, BlobStorage
from app.infrastructure.storage.legacy import LegacyAwareStorage
from tests.fakes import InMemoryStorage


def creds(expires_in=600):
    return {"accessKeyId": "ak", "secretAccessKey": "sk", "sessionToken": "st",
            "endpoint": "https://abc.r2.cloudflarestorage.com", "bucket": "bkt", "region": "auto",
            "expiresAt": time.time() + expires_in}


@pytest.fixture
def blob():
    """A BlobStorage whose credential exchange and S3 client are mocked."""
    with patch("app.infrastructure.storage.blob.httpx.post") as post, \
         patch("app.infrastructure.storage.blob.boto3.client") as boto:
        post.return_value = MagicMock(json=lambda: creds())
        s3 = boto.return_value
        yield BlobStorage("blob-token"), post, boto, s3


def test_keys_are_unique_prefixed_and_recognised_as_ours():
    storage = BlobStorage("t")
    a, b, edited = storage.new_key(), storage.new_key(), storage.new_key("edited_")
    assert a != b and a.startswith(PREFIX) and edited.startswith(f"{PREFIX}edited_") and a.endswith(".pdf")
    assert storage.owns(a) and not storage.owns("pdfs/legacy.pdf") and not storage.owns("https://x/y.pdf") and not storage.owns(None)


def test_credentials_are_exchanged_once_and_reused(blob):
    storage, post, boto, _ = blob
    storage._client()
    storage._client()
    assert post.call_count == 1 and boto.call_count == 1
    assert post.call_args.kwargs["headers"] == {"Authorization": "Bearer blob-token"}
    assert boto.call_args.kwargs["endpoint_url"] == "https://abc.r2.cloudflarestorage.com"
    assert boto.call_args.kwargs["aws_session_token"] == "st"


def test_credentials_refresh_shortly_before_they_expire(blob):
    storage, post, _, _ = blob
    post.return_value = MagicMock(json=lambda: creds(expires_in=REFRESH_MARGIN_S - 5))
    storage._client()
    storage._client()
    assert post.call_count == 2


async def test_put_get_delete_use_the_bucket_and_key(blob):
    storage, _, _, s3 = blob
    s3.get_object.return_value = {"Body": MagicMock(read=lambda: b"bytes")}
    await storage.put("docs/a.pdf", b"bytes")
    assert await storage.get("docs/a.pdf") == b"bytes"
    await storage.delete("docs/a.pdf")
    s3.put_object.assert_called_once_with(Bucket="bkt", Key="docs/a.pdf", Body=b"bytes", ContentType="application/pdf")
    s3.delete_object.assert_called_once_with(Bucket="bkt", Key="docs/a.pdf")


async def test_a_missing_object_raises_file_not_found_and_other_errors_propagate(blob):
    storage, _, _, s3 = blob
    s3.get_object.side_effect = ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
    with pytest.raises(FileNotFoundError):
        await storage.get("docs/missing.pdf")
    s3.get_object.side_effect = ClientError({"Error": {"Code": "AccessDenied"}}, "GetObject")
    with pytest.raises(ClientError):
        await storage.get("docs/forbidden.pdf")


# -- legacy-aware wrapper -----------------------------------------------------------------------
async def test_new_files_go_to_the_inner_storage():
    inner = InMemoryStorage()
    storage = LegacyAwareStorage(inner)
    key = storage.new_key("edited_")
    await storage.put(key, b"data")
    assert inner.files[key] == b"data" and await storage.get(key) == b"data" and storage.owns(key)
    await storage.delete(key)
    assert key not in inner.files


async def test_old_local_paths_are_still_readable(tmp_path):
    path = tmp_path / "old.pdf"
    path.write_bytes(b"legacy bytes")
    assert await LegacyAwareStorage(InMemoryStorage()).get(str(path)) == b"legacy bytes"


async def test_a_missing_local_file_raises_file_not_found():
    with pytest.raises(FileNotFoundError):
        await LegacyAwareStorage(InMemoryStorage()).get("pdfs/never-existed.pdf")


async def test_old_s3_urls_are_fetched_over_http():
    transport = httpx.MockTransport(lambda request: httpx.Response(200, content=b"from s3"))
    real_client = httpx.AsyncClient      # patching the module attribute would otherwise recurse into the patch
    with patch.object(legacy.httpx, "AsyncClient", lambda: real_client(transport=transport)):
        assert await LegacyAwareStorage(InMemoryStorage()).get("https://bucket.s3.amazonaws.com/x.pdf") == b"from s3"


async def test_legacy_paths_are_not_claimed_as_ours_so_they_are_never_deleted_from_blob():
    assert not LegacyAwareStorage(BlobStorage("t")).owns("pdfs/old.pdf")
