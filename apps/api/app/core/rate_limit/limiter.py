import asyncio
import logging
from pathlib import Path

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.rate_limit.config import (
    POLICIES,
    REDIS_TIMEOUT_SECONDS,
    TOKEN_SCALE,
    TTL_BUFFER_MS,
)
from app.core.rate_limit.identity import make_bucket_key
from app.core.rate_limit.schema import RateLimitResult

logger = logging.getLogger(__name__)

SCRIPT_PATH = Path(__file__).parent.parent / "scripts" / "token_bucket.lua"


class RateLimiterUnavailable(RuntimeError):
    """Raised when Redis cannot enforce a rate limit."""


class RateLimiter:
    def __init__(
        self,
        redis: Redis,
        *,
        hmac_secret: bytes,
    ) -> None:
        if len(hmac_secret) < 32:
            raise ValueError("Rate-limit HMAC secret must be at least 32 bytes")

        self._redis = redis
        self._hmac_secret = hmac_secret

        # Load the source from a real Lua file.
        # redis-py Script handles EVALSHA and NOSCRIPT recovery.
        source = SCRIPT_PATH.read_text(encoding="utf-8")
        self._script = redis.register_script(source)

    async def check(
        self,
        group: str,
        client_ip: str,
        *,
        cost: int = 1,
    ) -> RateLimitResult:
        try:
            policy = POLICIES[group]
        except KeyError as exc:
            raise ValueError(f"Unknown rate-limit group: {group}") from exc

        if not 1 <= cost <= policy.capacity:
            raise ValueError(f"Cost must be between 1 and {policy.capacity}")

        key = make_bucket_key(
            group,
            client_ip,
            self._hmac_secret,
        )

        try:
            async with asyncio.timeout(REDIS_TIMEOUT_SECONDS):
                raw = await self._script(
                    keys=[key],
                    args=[
                        policy.capacity * TOKEN_SCALE,
                        policy.refill_period_ms,
                        cost * TOKEN_SCALE,
                        TTL_BUFFER_MS,
                    ],
                    client=self._redis,
                )

        except (RedisError, TimeoutError) as exc:
            raise RateLimiterUnavailable("Rate-limit storage is unavailable") from exc

        try:
            allowed, remaining, retry_after_ms = map(
                int,
                raw,
            )
        except (TypeError, ValueError) as exc:
            raise RateLimiterUnavailable("Invalid rate-limiter response") from exc

        if allowed not in (0, 1):
            raise RateLimiterUnavailable("Invalid rate-limiter decision")

        if not 0 <= remaining <= policy.capacity:
            raise RateLimiterUnavailable("Invalid remaining-token count")

        if retry_after_ms < 0:
            raise RateLimiterUnavailable("Invalid retry delay")

        return RateLimitResult(
            allowed=bool(allowed),
            limit=policy.capacity,
            remaining=remaining,
            retry_after_ms=retry_after_ms,
        )
