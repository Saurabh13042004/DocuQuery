"""Upstash Blob storage.

Upstash Blob is a private R2 bucket. The bucket token is exchanged at the Blob agent for short-lived
S3 credentials (~10 min) that boto3 uses against R2's S3-compatible API. Objects are private, so
the API streams them to the browser instead of handing out URLs.
"""
from __future__ import annotations

import asyncio
import threading
import time
import uuid

import boto3
import httpx
from botocore.config import Config
from botocore.exceptions import ClientError

PREFIX = "docs/"  # every object we create lives under this prefix; the DB stores the key
AGENT_URL = "https://blob.upstash.io/v1/credentials"
REFRESH_MARGIN_S = 30  # the agent re-mints once <60s is left, so refreshing at 30s always gets a fresh one


class BlobStorage:
    def __init__(self, token: str):
        self._token = token
        self._lock = threading.Lock()
        self._s3 = None
        self._bucket = ""
        self._refresh_at = 0.0

    def new_key(self, prefix: str = "") -> str:
        return f"{PREFIX}{prefix}{uuid.uuid4().hex}.pdf"

    def owns(self, key: str | None) -> bool:
        return bool(key) and key.startswith(PREFIX)

    def _client(self):
        """(client, bucket), minting fresh credentials when the cached ones are about to expire."""
        with self._lock:
            if self._s3 is None or time.time() >= self._refresh_at:
                resp = httpx.post(AGENT_URL, headers={"Authorization": f"Bearer {self._token}"}, timeout=10)
                resp.raise_for_status()
                c = resp.json()
                self._s3 = boto3.client(
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
                self._bucket = c["bucket"]
                self._refresh_at = c["expiresAt"] - REFRESH_MARGIN_S
            return self._s3, self._bucket

    async def put(self, key: str, data: bytes, content_type: str = "application/pdf") -> None:
        def _do():
            s3, bucket = self._client()
            s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
        await asyncio.to_thread(_do)

    async def get(self, key: str) -> bytes:
        def _do():
            s3, bucket = self._client()
            try:
                return s3.get_object(Bucket=bucket, Key=key)["Body"].read()
            except ClientError as e:
                if e.response.get("Error", {}).get("Code") in ("NoSuchKey", "404"):
                    raise FileNotFoundError(key) from e
                raise
        return await asyncio.to_thread(_do)

    async def delete(self, key: str) -> None:
        def _do():
            s3, bucket = self._client()
            s3.delete_object(Bucket=bucket, Key=key)
        await asyncio.to_thread(_do)
