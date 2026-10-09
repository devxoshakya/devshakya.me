# app/services/token_rotation.py
import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import Unauthorized
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token import RefreshTokenRepository, generate_opaque_token
from app.services.blacklist import BlacklistService


class RefreshTokenRotationService:
    def __init__(self, db: AsyncSession, blacklist_service: BlacklistService):
        self.db = db
        self.repo = RefreshTokenRepository(db)
        self.blacklist = blacklist_service

    async def rotate_refresh_token(self, raw_token: str) -> tuple[str, UUID, int]:
        """
        Executes token rotation.
        Returns: (new_raw_token, family_id, admin_id)
        """
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).digest()
        now = datetime.now(UTC)

        # 1. Fetch token record with FOR UPDATE lock to ensure concurrency safety
        stmt = (
            select(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .with_for_update()
        )
        res = await self.db.execute(stmt)
        token_row = res.scalar_one_or_none()

        if not token_row:
            raise Unauthorized("Invalid refresh token.")

        # 2. Revocation check
        if token_row.revoked_at is not None:
            raise Unauthorized("Refresh token is revoked.")

        # 3. Absolute session cap check
        max_session_limit = token_row.family_started_at + timedelta(
            days=settings.SESSION_MAX_DAYS
        )
        if now > max_session_limit:
            await self.repo.revoke_family(token_row.family_id)
            await self.blacklist.revoke_family_flag(token_row.family_id)
            await self.db.commit()
            raise Unauthorized(
                "Session max duration exceeded. Please log in again."
            )

        # 4. Token expiration check
        if now > token_row.expires_at:
            raise Unauthorized("Refresh token has expired.")

        # 5. Token reuse detection & grace window logic
        if token_row.used_at is not None:
            grace_period_cutoff = token_row.used_at + timedelta(seconds=20)
            if now <= grace_period_cutoff:
                # Concurrent request within grace window (e.g., multi-tab refresh)
                raise Unauthorized(
                    "Token refresh race condition detected. Please retry."
                )

            # Token reuse detected outside grace window -> Revoke entire family
            await self.repo.revoke_family(token_row.family_id)
            await self.blacklist.revoke_family_flag(token_row.family_id)
            await self.db.commit()

            # Security Alert: Log potential stolen token reuse
            print(
                f"[SECURITY ALERT] Refresh token reuse detected for family_id={token_row.family_id}"
            )
            raise Unauthorized(
                "Invalid token operation. Session revoked for security."
            )

        # 6. Issue replacement token
        new_raw_token, new_hash = generate_opaque_token()
        new_expires = now + timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS)

        new_token_row = RefreshToken()
        new_token_row.token_hash = new_hash
        new_token_row.admin_id = token_row.admin_id
        new_token_row.family_id = token_row.family_id
        new_token_row.family_started_at = token_row.family_started_at
        new_token_row.auth_method = token_row.auth_method
        new_token_row.issued_at = now
        new_token_row.expires_at = new_expires
        self.db.add(new_token_row)
        await self.db.flush()

        # Mark current token as used and point to replacement
        token_row.used_at = now
        token_row.replaced_by = new_token_row.jti

        await self.db.commit()
        return new_raw_token, token_row.family_id, token_row.admin_id
