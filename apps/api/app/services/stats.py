# services/stats_service.py
import time

import httpx
from redis.asyncio import Redis

from app.clients.github import (
    fetch_github_contributions_raw,
    fetch_github_followers_raw,
)
from app.clients.wakatime import fetch_wakatime_raw
from app.core.cached_upstream import get_cached_upstream
from app.core.config import settings
from app.schemas.stats import (
    CodingStatsResponse,
    GithubContributionsResponse,
    GithubFollowersResponse,
)


async def get_coding_stats(
    redis: Redis, client: httpx.AsyncClient
) -> CodingStatsResponse:
    payload, is_stale = await get_cached_upstream(
        redis=redis,
        namespace="waka",
        fetch_func=lambda: fetch_wakatime_raw(client),
        fresh_ttl=settings.WAKA_FRESH_TTL_SEC,
        stale_ttl=settings.WAKA_STALE_TTL_SEC,
    )

    now = time.time()
    last_act = payload.get("last_activity_at")

    is_active = False
    if last_act is not None:
        last_act = min(last_act, now)
        if (now - last_act) <= settings.WAKA_ACTIVE_WINDOW_SEC:
            is_active = True

    return CodingStatsResponse(
        is_active=is_active,
        total_seconds=payload["total_seconds"],
        daily_seconds=payload.get("daily_seconds", 0.0),  
        stale=is_stale,
    )


async def get_gh_contributions(
    redis: Redis, client: httpx.AsyncClient
) -> GithubContributionsResponse:
    payload, is_stale = await get_cached_upstream(
        redis=redis,
        namespace="gh:contrib",
        fetch_func=lambda: fetch_github_contributions_raw(client),
        fresh_ttl=settings.GH_FRESH_TTL_SEC,
        stale_ttl=settings.GH_STALE_TTL_SEC,
    )

    contribs = payload["contributions"]

    return GithubContributionsResponse(
        total=payload["total"],
        from_date=contribs[0]["date"],
        to_date=contribs[-1]["date"],
        contributions=contribs,
        stale=is_stale,
    )


async def get_gh_followers(
    redis: Redis, client: httpx.AsyncClient
) -> GithubFollowersResponse:
    payload, is_stale = await get_cached_upstream(
        redis=redis,
        namespace="gh:followers",
        fetch_func=lambda: fetch_github_followers_raw(client),
        fresh_ttl=settings.GH_FRESH_TTL_SEC,
        stale_ttl=settings.GH_STALE_TTL_SEC,
    )

    return GithubFollowersResponse(followers=payload["followers"], stale=is_stale)
