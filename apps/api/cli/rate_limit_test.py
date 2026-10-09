import asyncio
import os
import secrets

import httpx


async def send_health_request(
    client: httpx.AsyncClient,
    client_ip: str,
) -> httpx.Response:
    return await client.get(
        "/health",
        headers={"X-Forwarded-For": client_ip},
    )


async def run_test() -> None:
    # A random IP avoids reusing a bucket from an earlier test.
    test_ip = f"198.51.100.{secrets.randbelow(254) + 1}"
    base_url = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

    async with httpx.AsyncClient(base_url=base_url, timeout=10) as client:
        responses = await asyncio.gather(
            *[send_health_request(client, test_ip) for _ in range(70)]
        )

    for request_number, response in enumerate(responses, start=1):
        print(f"Request {request_number:02}: {response.status_code}")

    rate_limited = [
        request_number
        for request_number, response in enumerate(responses, start=1)
        if response.status_code == 429
    ]
    print(f"Rate-limited requests: {rate_limited or 'none'}")

    allowed = sum(response.status_code == 200 for response in responses)
    print(f"Summary: {allowed} allowed, {len(rate_limited)} rate-limited")

    assert allowed == 60
    assert len(rate_limited) == 10
    assert all(
        response.json()["status"] == "ok"
        for response in responses
        if response.status_code == 200
    )


if __name__ == "__main__":
    asyncio.run(run_test())
