import uuid
from collections.abc import AsyncGenerator
from pathlib import Path

from redis.asyncio import Redis

RELEASE_LOCK_LUA = (
    Path(__file__).resolve().parent / "scripts" / "release_lock.lua"
).read_text(encoding="utf-8")


class RedisLock:
    def __init__(
        self,
        redis: Redis,
        key: str,
        ttl_seconds: int = 30,
        token: str | None = None,
    ):
        self.redis = redis
        self.key = key
        self.ttl = ttl_seconds
        self.token = token or str(uuid.uuid4())

    async def acquire(self) -> bool:
        """Acquire a distributed lock using SET NX EX."""
        result = await self.redis.set(
            self.key,
            self.token,
            nx=True,
            ex=self.ttl,
        )
        return bool(result)

    async def release(self) -> bool:
        """Release the lock atomically if its token still matches."""
        result = await self.redis.eval(
            RELEASE_LOCK_LUA,
            1,
            self.key,
            self.token,
        )
        return bool(result)


async def acquire_lock(
    redis: Redis,
    key: str,
    ttl_seconds: int = 30,
) -> AsyncGenerator[str | None, None]:
    """Yield the lock token if acquired, then release the lock."""
    lock = RedisLock(redis, key, ttl_seconds)

    if not await lock.acquire():
        yield None
        return

    try:
        yield lock.token
    finally:
        await lock.release()
