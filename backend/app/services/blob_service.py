"""File storage on Upstash Blob.

Upstash Blob is a private R2 bucket. The bucket token is exchanged at the Blob agent for short-lived
S3 credentials (~10 min), which boto3 uses against R2's S3-compatible API. Objects are private, so
the API streams them to the browser (see GET /documents/{id}/file) instead of handing out URLs.
"""
import asyncio
import os
import threading
import time
import uuid

import boto3
import httpx
from botocore.config import Config
from botocore.exceptions import ClientError

PREFIX = "docs/"  # every object we store lives under this prefix; DB file_path holds the key
_AGENT_URL = "https://blob.upstash.io/v1/credentials"
_REFRESH_MARGIN_S = 30  # the agent re-mints once <60s is left, so refreshing at 30s always gets a fresh one

_lock = threading.Lock()
_cache: dict = {"s3": None, "bucket": None, "refresh_at": 0.0}


def new_key(prefix: str = "") -> str:
    return f"{PREFIX}{prefix}{uuid.uuid4().hex}.pdf"


def is_blob_key(path: str | None) -> bool:
    return bool(path) and path.startswith(PREFIX)


def _s3():
    """Return (client, bucket), minting fresh credentials when the cached ones are about to expire."""
    with _lock:
        if _cache["s3"] is None or time.time() >= _cache["refresh_at"]:
            resp = httpx.post(
                _AGENT_URL,
                headers={"Authorization": f"Bearer {os.environ['UPSTASH_BLOB_TOKEN'].strip()}"},
                timeout=10,
            )
            resp.raise_for_status()
            c = resp.json()
            _cache["s3"] = boto3.client(
                "s3",
                endpoint_url=c["endpoint"],
                aws_access_key_id=c["accessKeyId"],
                aws_secret_access_key=c["secretAccessKey"],
                aws_session_token=c["sessionToken"],
                region_name=c["region"],
                config=Config(
                    signature_version="s3v4",
                    s3={"addressing_style": "path"},
                    # R2 rejects the extra checksum headers newer boto3 adds by default
                    request_checksum_calculation="when_required",
                    response_checksum_validation="when_required",
                ),
            )
            _cache["bucket"] = c["bucket"]
            _cache["refresh_at"] = c["expiresAt"] - _REFRESH_MARGIN_S
        return _cache["s3"], _cache["bucket"]


async def put(key: str, data: bytes, content_type: str = "application/pdf") -> None:
    def _do():
        s3, bucket = _s3()
        s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
    await asyncio.to_thread(_do)


async def get(key: str) -> bytes:
    def _do():
        s3, bucket = _s3()
        try:
            return s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in ("NoSuchKey", "404"):
                raise FileNotFoundError(key) from e
            raise
    return await asyncio.to_thread(_do)


async def delete(key: str) -> None:
    def _do():
        s3, bucket = _s3()
        s3.delete_object(Bucket=bucket, Key=key)
    await asyncio.to_thread(_do)
