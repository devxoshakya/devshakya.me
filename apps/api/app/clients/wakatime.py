# clients/wakatime.py
import asyncio
import base64
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import httpx

from app.core.config import settings

# Assuming global client initialized in lifespan: `from core.globals import http_client`
# For this code, I'll pass it as a parameter.


class WakatimeError(Exception):
    pass


class WakatimeNotReady(WakatimeError):
    pass  # For 202s


async def fetch_wakatime_raw(client: httpx.AsyncClient) -> dict[str, Any]:
    auth_header = (
        f"Basic {base64.b64encode(settings.WAKATIME_API_KEY.encode()).decode()}"
    )
    headers = {"Authorization": auth_header}

    # "Today" relative to WakaTime config
    tz = ZoneInfo(settings.WAKATIME_TIMEZONE)
    today_str = datetime.now(tz).strftime("%Y-%m-%d")

    async def get_total():
        resp = await client.get(
            "https://wakatime.com/api/v1/users/current/all_time_since_today",
            headers=headers,
            timeout=5.0,
        )
        if resp.status_code == 202:
            raise WakatimeNotReady("WakaTime is computing stats")
        resp.raise_for_status()
        return resp.json()["data"]["total_seconds"]

    async def get_durations():
        resp = await client.get(
            f"https://wakatime.com/api/v1/users/current/durations?date={today_str}",
            headers=headers,
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()["data"]

        last_activity = None
        daily_seconds = 0.0  

        if data:
            # max(start + duration) for the last active moment
            last_activity = max(block["time"] + block["duration"] for block in data)
            # sum(duration) for today's total time
            daily_seconds = sum(block["duration"] for block in data)  

        return last_activity, daily_seconds

    # Update the gather call to unpack both values:
    total_seconds, (last_activity, daily_seconds) = await asyncio.gather(
        get_total(), get_durations()
    )

    return {
        "total_seconds": total_seconds,
        "last_activity_at": last_activity,
        "daily_seconds": daily_seconds,  
    }
