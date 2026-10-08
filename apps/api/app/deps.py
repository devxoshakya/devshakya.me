from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.client_ip import get_client_ip as _get_client_ip
from app.core.config import Settings, get_settings
from app.db.session import session_scope


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    async for session in session_scope(request.app.state.session_factory):
        yield session


def get_redis(request: Request) -> Redis:
    return request.app.state.redis


def get_client_ip(
    request: Request,
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> str:
    return _get_client_ip(
        request,
        settings.CLIENT_IP_HEADER,
    )


DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[Redis, Depends(get_redis)]
ClientIP = Annotated[str, Depends(get_client_ip)]