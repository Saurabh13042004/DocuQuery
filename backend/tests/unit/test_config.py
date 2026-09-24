import pytest

from app.core.config import Settings


def env(**overrides):
    base = {"DATABASE_URL": "postgresql://x", "SECRET_KEY": "s" * 32}
    return {**base, **overrides}


def test_defaults_and_typed_values():
    s = Settings.from_env(env())
    assert s.environment == "development" and not s.is_production
    assert s.openai_chat_model == "gpt-4o-mini" and s.embedding_dimensions == 768
    assert s.max_upload_bytes == 10 * 1024 * 1024 and s.smtp_port == 587


def test_values_pasted_with_quotes_and_spaces_are_cleaned():
    s = Settings.from_env(env(UPSTASH_VECTOR_REST_URL=' "https://v.upstash.io" ', UPSTASH_VECTOR_REST_TOKEN="'tok'"))
    assert s.upstash_vector_url == "https://v.upstash.io" and s.upstash_vector_token == "tok"


def test_cors_origins_are_split_and_trailing_slashes_removed():
    s = Settings.from_env(env(CORS_ORIGINS="https://a.com/, https://b.com ,,", FRONTEND_URL="https://app.com/"))
    assert s.cors_origins == ("https://a.com", "https://b.com") and s.frontend_url == "https://app.com"


def test_database_url_is_required():
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        Settings.from_env({"SECRET_KEY": "x"})


def test_production_refuses_the_default_secret():
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        Settings.from_env({"DATABASE_URL": "x", "ENVIRONMENT": "production"})
    assert Settings.from_env(env(ENVIRONMENT="production")).is_production


def test_require_names_what_is_missing():
    s = Settings.from_env(env())
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        s.require("openai_api_key")
    Settings.from_env(env(OPENAI_API_KEY="k")).require("openai_api_key")
