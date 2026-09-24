import json

from app.infrastructure.cache.redis_memory import MAX_TURNS, TTL_SECONDS, RedisChatMemory
from app.rag.types import ChatTurn


class FakeRedis:
    def __init__(self):
        self.data: dict[str, list[str]] = {}
        self.ttls: dict[str, int] = {}

    def lrange(self, key, start, end):
        return list(self.data.get(key, []))

    def rpush(self, key, value):
        self.data.setdefault(key, []).append(value)

    def llen(self, key):
        return len(self.data.get(key, []))

    def ltrim(self, key, start, end):
        self.data[key] = self.data[key][start:]

    def expire(self, key, seconds):
        self.ttls[key] = seconds

    def delete(self, key):
        self.data.pop(key, None)


def memory():
    redis = FakeRedis()
    return RedisChatMemory("u", "t", client=redis), redis


async def test_append_and_get_round_trip_in_order():
    mem, _ = memory()
    await mem.append(1, "user", "hello")
    await mem.append(1, "assistant", "hi there")
    assert await mem.get(1) == [ChatTurn("user", "hello"), ChatTurn("assistant", "hi there")]


async def test_conversations_are_kept_per_document():
    mem, _ = memory()
    await mem.append(1, "user", "for one")
    assert await mem.get(2) == []


async def test_only_the_most_recent_turns_are_kept():
    mem, redis = memory()
    for i in range(MAX_TURNS + 5):
        await mem.append(1, "user", f"m{i}")
    turns = await mem.get(1)
    assert len(turns) == MAX_TURNS and turns[0].content == "m5" and turns[-1].content == f"m{MAX_TURNS + 4}"


async def test_history_expires_after_a_day():
    mem, redis = memory()
    await mem.append(1, "user", "x")
    assert redis.ttls["chat:1"] == TTL_SECONDS == 86400


async def test_clear_removes_the_history_and_is_safe_to_repeat():
    mem, redis = memory()
    await mem.append(1, "user", "x")
    await mem.clear(1)
    await mem.clear(1)
    assert await mem.get(1) == [] and json.loads(json.dumps(redis.data)) == {}
