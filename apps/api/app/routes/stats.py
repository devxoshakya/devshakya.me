from fastapi import APIRouter, Response

from app.deps import HttpClient, RedisClient
from app.schemas.stats import (
    CodingStatsResponse,
    GithubContributionsResponse,
    GithubFollowersResponse,
)
from app.services.stats import (
    get_coding_stats,
    get_gh_contributions,
    get_gh_followers,
)

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/coding", response_model=CodingStatsResponse)
async def fetch_coding_stats(
    response: Response, redis: RedisClient, client: HttpClient
):
    data = await get_coding_stats(redis, client)
    response.headers["Cache-Control"] = "public, s-maxage=30, stale-while-revalidate=60"
    return data


@router.get("/github/contributions", response_model=GithubContributionsResponse)
async def fetch_github_contributions(
    response: Response, redis: RedisClient, client: HttpClient
):
    data = await get_gh_contributions(redis, client)
    response.headers["Cache-Control"] = (
        "public, s-maxage=600, stale-while-revalidate=3600"
    )
    return data


@router.get("/github/followers", response_model=GithubFollowersResponse)
async def fetch_github_followers(
    response: Response, redis: RedisClient, client: HttpClient
):
    data = await get_gh_followers(redis, client)
    response.headers["Cache-Control"] = (
        "public, s-maxage=600, stale-while-revalidate=3600"
    )
    return data
