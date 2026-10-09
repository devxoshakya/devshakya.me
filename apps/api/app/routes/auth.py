# app/routes/auth.py
import hashlib
import logging
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select

from app.core.config import settings
from app.core.csrf import verify_csrf_protection
from app.core.exceptions import ServiceUnavailable, Unauthorized
from app.core.jwt import issue_access_token, verify_access_token
from app.deps import BlacklistSvc, DbSession, RedisClient, get_current_admin
from app.models.admin import Admin
from app.repositories.refresh_token import RefreshTokenRepository
from app.schemas.auth import (
    AuthTokenResponse,
    MeResponse,
    PasskeyLoginVerifyRequest,
    PasskeyRegisterOptionsRequest,
    PasskeyRegisterVerifyRequest,
    PasswordLoginRequest,
)
from app.services.auth import hash_password, needs_rehash, verify_password
from app.services.passkey import PasskeyService
from app.services.token_rotation import RefreshTokenRotationService

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


def set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key="__Secure-refresh_token",
        value=raw_token,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_TTL_DAYS * 86400,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key="__Secure-refresh_token",
        path="/api/v1/auth",
        httponly=True,
        secure=True,
        samesite="strict",
    )


@router.post("/login/password", response_model=AuthTokenResponse)
async def login_password(
    payload: PasswordLoginRequest,
    response: Response,
    db: DbSession,
):
    response.headers["Cache-Control"] = "no-store"
    
    stmt = select(Admin).where(Admin.id == 1)
    admin = (await db.execute(stmt)).scalar_one_or_none()

    stored_hash = admin.password_hash if admin else None
    if not await verify_password(payload.password, stored_hash) or not admin:
        raise Unauthorized("Invalid credentials.")

    # Rehash check on parameter changes
    if needs_rehash(admin.password_hash):
        admin.password_hash = await hash_password(payload.password)

    admin.last_login_at = datetime.now(UTC)
    family_id = uuid.uuid4()

    repo = RefreshTokenRepository(db)
    raw_rt, _ = await repo.create_token(
        admin_id=admin.id,
        family_id=family_id,
        auth_method="pwd"
    )
    await repo.purge_expired()
    await db.commit()

    access_token = issue_access_token(
        admin_id=admin.id,
        family_id=str(family_id),
        amr="pwd",
    )
    set_refresh_cookie(response, raw_rt)
    return AuthTokenResponse(access_token=access_token)


@router.post("/refresh", response_model=AuthTokenResponse, dependencies=[Depends(verify_csrf_protection)])
async def refresh_tokens(
    request: Request,
    response: Response,
    db: DbSession,
    blacklist_service: BlacklistSvc
):
    response.headers["Cache-Control"] = "no-store"
    raw_rt = request.cookies.get("__Secure-refresh_token")
    if not raw_rt:
        raise Unauthorized("Refresh token missing.")

    rotation_service = RefreshTokenRotationService(db, blacklist_service)
    try:
        new_raw_rt, family_id, admin_id = await rotation_service.rotate_refresh_token(raw_rt)
    except Exception:
        clear_refresh_cookie(response)
        raise

    access_token = issue_access_token(
        admin_id=admin_id,
        family_id=str(family_id),
        amr="refresh",
    )
    set_refresh_cookie(response, new_raw_rt)
    return AuthTokenResponse(access_token=access_token)


@router.post("/logout", dependencies=[Depends(verify_csrf_protection)])
async def logout(
    request: Request,
    response: Response,
    db: DbSession ,
    blacklist_service: BlacklistSvc
):
    response.headers["Cache-Control"] = "no-store"
    
    # Optional access token revocation
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            claims = verify_access_token(token)
            await blacklist_service.blacklist_access_token(claims.jti, claims.exp)
        except (RuntimeError, ServiceUnavailable, Unauthorized):
            logger.info("access_token_blacklist_on_logout_failed", exc_info=True)

    # Revoke family via refresh cookie
    raw_rt = request.cookies.get("__Secure-refresh_token")
    if raw_rt:
        repo = RefreshTokenRepository(db)
        token_hash = hashlib.sha256(raw_rt.encode("utf-8")).digest()
        row = await repo.find_by_hash(token_hash)
        if row:
            await repo.revoke_family(row.family_id)
            await blacklist_service.revoke_family_flag(row.family_id)
            await db.commit()

    clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=MeResponse)
async def get_me(
    request: Request,
    admin: Annotated[Admin, Depends(get_current_admin)],
):
    # Retrieve amr from access token header
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise Unauthorized("Missing authorization header.")
    token = authorization.split(" ", 1)[1]
    claims = verify_access_token(token)
    return MeResponse(authenticated=True, amr=claims.amr)


@router.post("/passkey/register/options")
async def passkey_register_options(
    payload: PasskeyRegisterOptionsRequest,
    db: DbSession,
    redis: RedisClient,
):
    service = PasskeyService(db, redis)
    return await service.get_registration_options(payload.enrollment_token)


@router.post("/passkey/register/verify")
async def passkey_register_verify(
    payload: PasskeyRegisterVerifyRequest,
    db: DbSession,
    redis: RedisClient,
) -> dict[str, str]:
    service = PasskeyService(db, redis)
    cred = await service.verify_registration(payload.challenge_id, payload.credential_json, payload.label)
    return {"message": "Passkey registered", "credential_id": str(cred.id)}


@router.post("/passkey/login/options")
async def passkey_login_options(db: DbSession, redis: RedisClient):
    service = PasskeyService(db, redis)
    return await service.get_login_options()


@router.post("/passkey/login/verify", response_model=AuthTokenResponse)
async def passkey_login_verify(
    payload: PasskeyLoginVerifyRequest,
    response: Response,
    db: DbSession,
    redis: RedisClient,
):
    response.headers["Cache-Control"] = "no-store"
    service = PasskeyService(db, redis)
    await service.verify_login(payload.challenge_id, payload.credential_json)

    family_id = uuid.uuid4()
    repo = RefreshTokenRepository(db)
    raw_rt, _ = await repo.create_token(admin_id=1, family_id=family_id, auth_method="webauthn")
    await db.commit()

    access_token = issue_access_token(
        admin_id=1,
        family_id=str(family_id),
        amr="webauthn",
    )
    set_refresh_cookie(response, raw_rt)
    return AuthTokenResponse(access_token=access_token)