import os
import json
from upstash_redis import Redis
from dotenv import load_dotenv

load_dotenv()

_redis = Redis(
    url=os.environ["UPSTASH_REDIS_REST_URL"].strip('"'),
    token=os.environ["UPSTASH_REDIS_REST_TOKEN"].strip('"')
)

MAX_MESSAGES = 20
TTL_SECONDS = 86400  # 24 hours


def _key(document_id: int) -> str:
    return f"chat:{document_id}"


def get_history(document_id: int) -> list[dict]:
    raw = _redis.lrange(_key(document_id), 0, -1)
    return [json.loads(m) for m in raw]


def add_message(document_id: int, role: str, content: str):
    key = _key(document_id)
    _redis.rpush(key, json.dumps({"role": role, "content": content}))
    length = _redis.llen(key)
    if length > MAX_MESSAGES:
        _redis.ltrim(key, length - MAX_MESSAGES, -1)
    _redis.expire(key, TTL_SECONDS)


def clear_history(document_id: int):
    _redis.delete(_key(document_id))
