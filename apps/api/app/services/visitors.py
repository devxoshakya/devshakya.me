import logging

from fastapi import Request, Response
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis_helpers import VisitorRedisCache
from app.repositories.visitor import VisitorRepository
from app.services.visitor_identity import generate_vid, hash_vid, is_bot, parse_vid

logger = logging.getLogger(__name__)


class VisitorService:
    def __init__(self, session: AsyncSession, redis: Redis):
        self.repo = VisitorRepository(session)
        self.cache = VisitorRedisCache(redis)

    async def get_or_rebuild_total(self) -> int:
        """Reads total from Redis. If missing, rebuilds from Postgres via lock."""
        total = await self.cache.get_total()
        if total is not None:
            return total

        # Cache miss, attempt rebuild
        if await self.cache.acquire_rebuild_lock():
            db_total = await self.repo.count_all()
            await self.cache.set_total(db_total, ttl_seconds=3600)
            return db_total

        # Lock not acquired (someone else is rebuilding). Fall back to DB directly for this request.
        return await self.repo.count_all()

    async def process_visit(
        self, request: Request, response: Response, client_ip: str
    ) -> int:
        """
        Decision list for POST /visit.
        Returns the current total visitors.
        """
        # 1. Bot filter
        if is_bot(request):
            return await self.get_or_rebuild_total()

        # 2. Read and validate cookie
        raw_cookie = request.cookies.get("__Host-vid")
        valid_uuid = parse_vid(raw_cookie)

        is_new_cookie = False
        if valid_uuid:
            vid = valid_uuid
        else:
            vid = generate_vid()
            is_new_cookie = True

        vid_hash_bytes = hash_vid(vid)
        vid_hash_hex = vid_hash_bytes.hex()

        # 3. New visitor IP cap check
        if is_new_cookie:
            under_cap = await self.cache.check_newvid_cap(client_ip)
            if not under_cap:
                # Issue the cookie so they don't keep hitting the cap, but don't count them
                self._set_cookie(response, vid)
                return await self.get_or_rebuild_total()

        # 4. Redis Set Check
        sadd_result = await self.cache.sadd_vid(vid_hash_hex)

        if sadd_result == 0:
            # Already counted in Redis
            return await self.get_or_rebuild_total()

        # 5. Postgres ON CONFLICT DO NOTHING
        try:
            db_inserted = await self.repo.insert_if_absent(vid_hash_bytes)
        except Exception as e:  # noqa: BLE001
            # DB Error: Rollback Redis state so future attempts aren't blocked
            logger.error(f"DB insert failed for visitor: {e}")
            if sadd_result == 1:
                await self.cache.srem_vid(vid_hash_hex)
            return await self.get_or_rebuild_total()

        # 6. Increment logic
        if db_inserted:
            new_total = await self.cache.incr_total_if_exists()
            if new_total is None:
                # Key was missing (evicted/flushed). Rebuild entirely.
                await self.get_or_rebuild_total()

            # Attach cookie on genuinely new visits
            if is_new_cookie:
                self._set_cookie(response, vid)

        return await self.get_or_rebuild_total()

    def _set_cookie(self, response: Response, vid: str):
        response.set_cookie(
            key="__Host-vid",
            value=vid,
            max_age=31536000,  # 1 year
            path="/",
            domain=None,  # Must be None for __Host- prefix
            secure=True,
            httponly=True,
            samesite="lax",
        )
