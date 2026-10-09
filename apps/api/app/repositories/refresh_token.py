# app/repositories/refresh_token.py
import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.refresh_token import RefreshToken


def generate_opaque_token() -> tuple[str, bytes]:
    """Generate a raw URL-safe token and its SHA-256 hash."""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).digest()
    return raw_token, token_hash


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_token(
        self,
        admin_id: int,
        family_id: UUID,
        auth_method: str,
        family_started_at: datetime | None = None,
    ) -> tuple[str, RefreshToken]:
        """Create and flush a refresh-token record.

        The raw token is returned only to the caller and is never stored.
        The caller is responsible for committing the transaction.
        """
        raw_token, token_hash = generate_opaque_token()
        now = datetime.now(UTC)

        token_row = RefreshToken()
        token_row.token_hash = token_hash
        token_row.admin_id = admin_id
        token_row.family_id = family_id
        token_row.family_started_at = family_started_at or now
        token_row.auth_method = auth_method
        token_row.issued_at = now
        token_row.expires_at = now + timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS)

        self.db.add(token_row)
        await self.db.flush()

        return raw_token, token_row

    async def find_by_hash(self, token_hash: bytes) -> RefreshToken | None:
        """Find a refresh token by its SHA-256 hash."""
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_family(self, family_id: UUID) -> None:
        """Revoke every active token in a token family."""
        await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.family_id == family_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )

    async def revoke_token(self, token: RefreshToken) -> None:
        """Revoke one refresh token."""
        if token.revoked_at is None:
            token.revoked_at = datetime.now(UTC)
            await self.db.flush()

    async def purge_expired(self) -> int:
        """Delete expired refresh tokens and return the deletion count."""
        result = cast(
            CursorResult[Any],
            await self.db.execute(
                delete(RefreshToken).where(
                    RefreshToken.expires_at < datetime.now(UTC)
                )
            ),
        )
        return result.rowcount or 0
