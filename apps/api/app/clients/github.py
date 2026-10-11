# clients/github.py
from typing import Any

import httpx

from app.core.config import settings


class GithubError(Exception):
    pass


async def fetch_github_contributions_raw(client: httpx.AsyncClient) -> dict[str, Any]:
    url = f"https://github-contributions-api.jogruber.de/v4/{settings.GITHUB_USERNAME}?y=last"
    resp = await client.get(url, timeout=5.0)
    resp.raise_for_status()
    data = resp.json()

    contributions = data.get("contributions", [])
    if not contributions or len(contributions) < 350:
        raise GithubError("Malformed or suspiciously short contributions list")

    # Validate structure manually or via internal pydantic model
    total = sum(day.get("count", 0) for day in contributions)

    return {"total": total, "contributions": contributions}



async def fetch_github_followers_raw(client: httpx.AsyncClient) -> dict[str, Any]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Portfolio-API-Phase7",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    url = f"https://api.github.com/users/{settings.GITHUB_USERNAME}"
    resp = await client.get(url, headers=headers, timeout=5.0)
    resp.raise_for_status()

    data = resp.json()
    if "followers" not in data:
        raise GithubError("Followers field missing from GitHub response")

    return {"followers": int(data["followers"])}
