# schemas/stats.py
from pydantic import BaseModel


class CodingStatsResponse(BaseModel):
    is_active: bool
    total_seconds: float
    daily_seconds: float
    stale: bool = False


class ContributionDay(BaseModel):
    date: str
    count: int
    level: int


class GithubContributionsResponse(BaseModel):
    total: int
    from_date: str
    to_date: str
    contributions: list[ContributionDay]
    stale: bool = False


class GithubFollowersResponse(BaseModel):
    followers: int
    stale: bool = False
