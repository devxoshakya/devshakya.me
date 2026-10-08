import asyncio
import logging

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def check_db(db: AsyncSession) -> bool:
    try:
        await asyncio.wait_for(
            db.execute(text("SELECT 1")),
            timeout=2,
        )
        return True
    except Exception:
        logger.exception("db_check_failed")
        return False


async def check_redis(redis: Redis) -> bool:
    try:
        await asyncio.wait_for(
            redis.ping(), # pyright: ignore[reportUnknownMemberType]
            timeout=2,
        )
        return True
    except Exception:
        logger.exception("redis_check_failed")
        return False


async def check_readiness(
    db: AsyncSession,
    redis: Redis,
) -> dict[str, bool]:
    db_ok, redis_ok = await asyncio.gather(
        check_db(db),
        check_redis(redis),
    )

    return {
        "db": db_ok,
        "redis": redis_ok,
    }