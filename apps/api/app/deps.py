from collections.abc import AsyncIterator
from typing import Annotated

import httpx
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.client_ip import get_client_ip as _get_client_ip
from app.core.config import Settings, get_settings
from app.core.exceptions import Unauthorized
from app.core.jwt import AccessTokenClaims, verify_access_token
from app.db.session import session_scope
from app.models.admin import Admin
from app.repositories.pin import PinRepository
from app.services.auth.blacklist import BlacklistService
from app.services.pins import PinService
from app.services.storage import R2StorageService, StorageService


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    async for session in session_scope(request.app.state.session_factory):
        yield session


def get_redis(request: Request) -> Redis:
    return request.app.state.redis


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client


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
HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]
ClientIP = Annotated[str, Depends(get_client_ip)]


def get_blacklist_service(redis: RedisClient) -> BlacklistService:
    return BlacklistService(redis)


BlacklistSvc = Annotated[BlacklistService, Depends(get_blacklist_service)]


security = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DbSession,
    blacklist_service: BlacklistSvc,
) -> Admin:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise Unauthorized("Missing or invalid authorization header.")

    token = credentials.credentials
    claims: AccessTokenClaims = verify_access_token(token)

    # Check revocation status in Redis
    if await blacklist_service.is_revoked(claims.jti, claims.fid):
        raise Unauthorized("Token has been revoked.")

    # Validate admin identity
    stmt = select(Admin).where(Admin.id == int(claims.sub))
    admin = (await db.execute(stmt)).scalar_one_or_none()
    if not admin:
        raise Unauthorized("Admin account not found.")

    return admin


_storage_instance: StorageService | None = None


def get_storage_service() -> StorageService:
    global _storage_instance
    settings = get_settings()
    if _storage_instance is None:
        _storage_instance = R2StorageService(
            account_id=settings.R2_ACCOUNT_ID,
            access_key_id=settings.R2_ACCESS_KEY_ID,
            secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            bucket=settings.R2_BUCKET,
        )
    return _storage_instance


def get_pin_service(
    redis: RedisClient,
    storage: Annotated[StorageService, Depends(get_storage_service)],
) -> PinService:
    repo = PinRepository()
    return PinService(redis=redis, storage=storage, pin_repo=repo)
