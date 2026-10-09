import logging
from pathlib import Path

from redis.asyncio import Redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

# Load Lua script from disk once at startup
SCRIPTS_DIR = Path(__file__).parent / "scripts"
with open(SCRIPTS_DIR / "incr_if_exists.lua", "r") as f:
    INCR_IF_EXISTS_SCRIPT = f.read()


class VisitorRedisCache:
    def __init__(self, redis: Redis):
        self.redis = redis
        # Register script for atomic execution
        self._incr_script = self.redis.register_script(INCR_IF_EXISTS_SCRIPT)

    async def sadd_vid(self, vid_hash_hex: str) -> int | None:
        try:
            return await self.redis.sadd("vis:all", vid_hash_hex)
        except RedisError:
            return None

    async def srem_vid(self, vid_hash_hex: str):
        try:
            await self.redis.srem("vis:all", vid_hash_hex)
        except RedisError:
            pass

    async def get_total(self) -> int | None:
        try:
            val = await self.redis.get("vis:total")
            return int(val) if val else None
        except RedisError:
            return None

    async def incr_total_if_exists(self) -> int | None:
        try:
            result = await self._incr_script(keys=["vis:total"])
            return int(result) if result else None
        except RedisError:
            return None

    async def set_total(self, total: int, ttl_seconds: int = 3600):
        try:
            await self.redis.set("vis:total", total, ex=ttl_seconds)
        except RedisError:
            pass

    async def acquire_rebuild_lock(self) -> bool:
        try:
            return bool(await self.redis.set("vis:rebuild:lock", "1", nx=True, ex=5))
        except RedisError:
            return False

    async def check_newvid_cap(self, ip: str, cap: int = 30) -> bool:
        key = f"vis:newvid:{ip}"
        try:
            count = await self.redis.incr(key)
            if count == 1:
                await self.redis.expire(key, 3600)
            return count <= cap
        except RedisError:
            return True  # Fail-open
