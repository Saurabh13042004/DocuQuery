"""Application settings, read once from the environment (and .env in development)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Mapping

from dotenv import load_dotenv

_DEFAULT_SECRET = "change-me-in-production"


def _clean(value: str | None) -> str:
    """Env values pasted from dashboards often carry quotes or whitespace."""
    return (value or "").strip().strip("\"'").strip()


def _csv(value: str | None) -> tuple[str, ...]:
    return tuple(v for v in (_clean(p).rstrip("/") for p in (value or "").split(",")) if v)


@dataclass(frozen=True)
class Settings:
    environment: str = "development"
    database_url: str = ""
    secret_key: str = _DEFAULT_SECRET
    access_token_minutes: int = 60 * 24
    reset_token_minutes: int = 30

    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 768  # must match the Upstash Vector index

    upstash_vector_url: str = ""
    upstash_vector_token: str = ""
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""
    upstash_blob_token: str = ""

    frontend_url: str = "http://localhost:5173"
    cors_origins: tuple[str, ...] = ()
    cors_origin_regex: str = r"https://docu-query[\w-]*\.vercel\.app"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "DocuQuery <no-reply@docuquery.app>"

    max_upload_mb: int = 10
    fonts_dir: str = field(default="")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "Settings":
        env = os.environ if env is None else env
        get = lambda key, default="": _clean(env.get(key)) or default  # noqa: E731
        settings = cls(
            environment=get("ENVIRONMENT", "development"),
            database_url=get("DATABASE_URL"),
            secret_key=get("SECRET_KEY", _DEFAULT_SECRET),
            openai_api_key=get("OPENAI_API_KEY"),
            openai_chat_model=get("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
            openai_embedding_model=get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
            upstash_vector_url=get("UPSTASH_VECTOR_REST_URL"),
            upstash_vector_token=get("UPSTASH_VECTOR_REST_TOKEN"),
            upstash_redis_url=get("UPSTASH_REDIS_REST_URL"),
            upstash_redis_token=get("UPSTASH_REDIS_REST_TOKEN"),
            upstash_blob_token=get("UPSTASH_BLOB_TOKEN"),
            frontend_url=get("FRONTEND_URL", "http://localhost:5173").rstrip("/"),
            cors_origins=_csv(env.get("CORS_ORIGINS")),
            cors_origin_regex=get("CORS_ORIGIN_REGEX", cls.cors_origin_regex),
            smtp_host=get("SMTP_HOST"),
            smtp_port=int(get("SMTP_PORT", "587")),
            smtp_user=get("SMTP_USER"),
            smtp_password=get("SMTP_PASSWORD"),
            smtp_from=get("SMTP_FROM", cls.smtp_from),
            max_upload_mb=int(get("MAX_UPLOAD_MB", "10")),
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if not self.database_url:
            raise RuntimeError("DATABASE_URL is required")
        if self.is_production and self.secret_key == _DEFAULT_SECRET:
            raise RuntimeError("SECRET_KEY must be set to a random value in production")

    def require(self, *names: str) -> None:
        """Fail with a clear message when an integration is used without its credentials."""
        missing = [n for n in names if not getattr(self, n)]
        if missing:
            raise RuntimeError(f"Missing configuration: {', '.join(m.upper() for m in missing)}")


@lru_cache
def get_settings() -> Settings:
    load_dotenv()
    return Settings.from_env()
