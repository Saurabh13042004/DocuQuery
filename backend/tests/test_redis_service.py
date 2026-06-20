"""Unit tests for app/services/redis_service.py"""
import json
import pytest
from unittest.mock import MagicMock, patch, call


# All tests patch the module-level _redis object
@pytest.fixture(autouse=True)
def patched_redis(mock_redis):
    """Ensure every test in this module uses the mocked Redis client."""
    return mock_redis


from app.services import redis_service


# ── key generation ────────────────────────────────────────────────────────────

def test_key_format():
    assert redis_service._key(42) == "chat:42"


def test_key_different_ids_differ():
    assert redis_service._key(1) != redis_service._key(2)


# ── get_history ───────────────────────────────────────────────────────────────

def test_get_history_empty(mock_redis):
    mock_redis.lrange.return_value = []
    result = redis_service.get_history(1)
    assert result == []
    mock_redis.lrange.assert_called_once_with("chat:1", 0, -1)


def test_get_history_single_message(mock_redis):
    msg = {"role": "user", "content": "Hello"}
    mock_redis.lrange.return_value = [json.dumps(msg)]
    result = redis_service.get_history(1)
    assert result == [msg]


def test_get_history_multiple_messages(mock_redis):
    msgs = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"},
    ]
    mock_redis.lrange.return_value = [json.dumps(m) for m in msgs]
    result = redis_service.get_history(5)
    assert result == msgs


def test_get_history_uses_correct_document_id(mock_redis):
    mock_redis.lrange.return_value = []
    redis_service.get_history(99)
    mock_redis.lrange.assert_called_once_with("chat:99", 0, -1)


# ── add_message ───────────────────────────────────────────────────────────────

def test_add_message_pushes_to_list(mock_redis):
    mock_redis.llen.return_value = 1
    redis_service.add_message(1, "user", "Hello")
    mock_redis.rpush.assert_called_once()
    args = mock_redis.rpush.call_args[0]
    assert args[0] == "chat:1"
    assert json.loads(args[1]) == {"role": "user", "content": "Hello"}


def test_add_message_sets_ttl(mock_redis):
    mock_redis.llen.return_value = 1
    redis_service.add_message(1, "user", "Hello")
    mock_redis.expire.assert_called_once_with("chat:1", redis_service.TTL_SECONDS)


def test_add_message_trims_when_over_max(mock_redis):
    over_limit = redis_service.MAX_MESSAGES + 5
    mock_redis.llen.return_value = over_limit
    redis_service.add_message(1, "user", "Hello")
    mock_redis.ltrim.assert_called_once_with(
        "chat:1", over_limit - redis_service.MAX_MESSAGES, -1
    )


def test_add_message_no_trim_when_under_max(mock_redis):
    mock_redis.llen.return_value = redis_service.MAX_MESSAGES - 1
    redis_service.add_message(1, "user", "Hello")
    mock_redis.ltrim.assert_not_called()


def test_add_message_role_assistant(mock_redis):
    mock_redis.llen.return_value = 1
    redis_service.add_message(7, "assistant", "I can help.")
    args = mock_redis.rpush.call_args[0]
    assert json.loads(args[1]) == {"role": "assistant", "content": "I can help."}


# ── clear_history ─────────────────────────────────────────────────────────────

def test_clear_history_deletes_key(mock_redis):
    redis_service.clear_history(3)
    mock_redis.delete.assert_called_once_with("chat:3")


def test_clear_history_uses_correct_document_id(mock_redis):
    redis_service.clear_history(42)
    mock_redis.delete.assert_called_once_with("chat:42")
