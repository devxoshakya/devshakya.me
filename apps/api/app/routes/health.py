from fastapi import APIRouter, Depends

from app.core.exceptions import ServiceUnavailable
from app.core.rate_limit import rate_limit
from app.deps import DbSession, RedisClient
from app.schemas.health import HealthOut, ReadyOut
from app.services.health import check_readiness

router = APIRouter(tags=["Health"])


@router.get(
    "/health", response_model=HealthOut, dependencies=[Depends(rate_limit("read"))]
)
async def health() -> HealthOut:
    return HealthOut(status="ok")


@router.get("/ready", response_model=ReadyOut)
async def ready(
    db: DbSession,
    redis: RedisClient,
) -> ReadyOut:
    checks = await check_readiness(db, redis)

    if not all(checks.values()):
        raise ServiceUnavailable(
            "DB or Redis is not working",
            details=[checks],
        )

    return ReadyOut(status="ok")
