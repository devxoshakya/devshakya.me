# app/services/blacklist.py
import asyncio
from datetime import UTC, datetime
from uuid import UUID

from redis.asyncio import Redis

from app.core.config import settings
from app.core.exceptions import ServiceUnavailable
from app.db.redis import create_redis


class BlacklistService:
    def __init__(self, redis_client: Redis | None = None):
        self._redis = redis_client

    def _get_redis(self) -> Redis:
        if self._redis is None:
            self._redis = create_redis(settings.REDIS_URL)
        return self._redis

    async def blacklist_access_token(self, jti: str, exp: datetime) -> None:
        """Adds a JWT JTI to the access token deny-list until its expiration."""
        try:
            redis = self._get_redis()
            now = datetime.now(UTC)
            ttl = int((exp - now).total_seconds())
            if ttl > 0:
                await redis.set(f"jwt:bl:{jti}", "1", ex=ttl)
        except Exception as exc:
            raise ServiceUnavailable(
                "Authentication service temporarily unavailable."
            ) from exc

    async def revoke_family_flag(self, family_id: UUID | str) -> None:
        """Sets a family revocation flag in Redis with a 30-day TTL."""
        try:
            redis = self._get_redis()
            await redis.set(f"rt:fam:revoked:{family_id}", "1", ex=30 * 86400)
        except Exception as exc:
            raise ServiceUnavailable(
                "Authentication service temporarily unavailable."
            ) from exc

    async def is_revoked(self, jti: str, family_id: UUID | str) -> bool:
        """Check both token blacklist and family revocation status."""
        try:
            redis = self._get_redis()
            results = await asyncio.gather(
                redis.exists(f"jwt:bl:{jti}"),
                redis.exists(f"rt:fam:revoked:{family_id}"),
            )
            return any(results)
        except Exception as exc:
            raise ServiceUnavailable(
                "Authentication service status check failed."
            ) from exc
