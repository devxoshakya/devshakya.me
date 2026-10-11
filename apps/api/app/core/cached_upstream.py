import asyncio
import json
import time
import uuid
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any, cast

from redis.asyncio import Redis

from app.core.exceptions import ServiceUnavailable

CachePayload = dict[str, Any]

# Lua script to delete the lock only if we own it.
RELEASE_LOCK_LUA = (
    Path(__file__).resolve().parent / "scripts" / "release_lock.lua"
).read_text(encoding="utf-8")


def _decode_payload(raw: str | bytes) -> CachePayload:
    """Decode a cached JSON object and validate its top-level structure."""
    payload: object = json.loads(raw)

    if not isinstance(payload, dict):
        raise ValueError("Cached upstream payload must be a JSON object")  # noqa: TRY004

    return cast(CachePayload, payload)


async def   get_cached_upstream(
    redis: Redis,
    namespace: str,
    fetch_func: Callable[[], Awaitable[CachePayload]],
    fresh_ttl: int,
    stale_ttl: int,
    lock_ttl: int = 10,
) -> tuple[CachePayload, bool]:
    fresh_key = f"stats:{namespace}:fresh"
    stale_key = f"stats:{namespace}:stale"
    lock_key = f"stats:{namespace}:lock"

    # 1. Check fresh cache.
    fresh_data = await redis.get(fresh_key)
    if fresh_data is not None:
        return _decode_payload(fresh_data), False

    # 2. Attempt to acquire the refresh lock.
    lock_token = str(uuid.uuid4())
    acquired = await redis.set(
        lock_key,
        lock_token,
        nx=True,
        ex=lock_ttl,
    )

    if not acquired:
        # Wait briefly for another request to refresh the cache.
        for _ in range(5):
            await asyncio.sleep(0.3)

            fresh_data = await redis.get(fresh_key)
            if fresh_data is not None:
                return _decode_payload(fresh_data), False

        # Fall back to stale data if the refresh is still in progress.
        stale_data = await redis.get(stale_key)
        if stale_data is not None:
            return _decode_payload(stale_data), True

        raise ServiceUnavailable("Service currently refreshing data")

    # 3. Lock holder fetches fresh data from upstream.
    try:
        data = await fetch_func()
        data["fetched_at"] = int(time.time())

        data_str = json.dumps(data)

        # Store fresh and stale copies with independent TTLs.
        await redis.set(fresh_key, data_str, ex=fresh_ttl)
        await redis.set(stale_key, data_str, ex=stale_ttl)

        return data, False

    except Exception as exc:
        # Upstream failure: fall back to stale cached data.
        stale_data = await redis.get(stale_key)
        if stale_data is not None:
            return _decode_payload(stale_data), True

        # Preserve the cause for debugging.
        raise ServiceUnavailable(
            "Upstream unavailable and no cached data"
        ) from exc

    finally:
        # Release the lock only if we still own it.
        await redis.eval(
            RELEASE_LOCK_LUA,
            1,
            lock_key,
            lock_token,
        )
