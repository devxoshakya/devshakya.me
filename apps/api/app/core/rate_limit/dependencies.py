import logging
import math

from fastapi import HTTPException, Request, Response

from app.core.rate_limit.config import POLICIES
from app.core.rate_limit.limiter import RateLimiterUnavailable
from app.deps import ClientIP

logger = logging.getLogger(__name__)


def rate_limit(
    group: str,
    *,
    cost: int = 1,
):
    policy = POLICIES.get(group)

    if policy is None:
        raise ValueError(f"Unknown rate-limit group: {group}")

    if not 1 <= cost <= policy.capacity:
        raise ValueError(f"Invalid cost for rate-limit group {group}")

    async def dependency(
        request: Request,
        response: Response,
        client_ip: ClientIP,
    ) -> None:
        limiter = request.app.state.rate_limiter

        try:
            result = await limiter.check(
                group,
                client_ip,
                cost=cost,
            )
        except RateLimiterUnavailable as exc:
            request_id = getattr(
                request.state,
                "request_id",
                "-",
            )

            logger.warning(
                "rate_limit_storage_unavailable group=%s mode=%s request_id=%s",
                group,
                policy.failure_mode,
                request_id,
            )

            if policy.failure_mode == "closed":
                raise HTTPException(
                    status_code=503,
                    detail={
                        "code": "rate_limiter_unavailable",
                        "message": ("Request protection is temporarily unavailable."),
                    },
                    headers={"Retry-After": "1"},
                ) from exc

            response.headers["X-RateLimit-Limit"] = str(policy.capacity)
            return

        response.headers["X-RateLimit-Limit"] = str(result.limit)
        response.headers["X-RateLimit-Remaining"] = str(result.remaining)

        if not result.allowed:
            retry_after = max(
                1,
                math.ceil(result.retry_after_ms / 1000),
            )

            raise HTTPException(
                status_code=429,
                detail={
                    "code": "rate_limited",
                    "message": ("Too many requests. Please try again later."),
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(result.limit),
                    "X-RateLimit-Remaining": str(result.remaining),
                },
            )

    return dependency
