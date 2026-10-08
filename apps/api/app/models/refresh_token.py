import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    LargeBinary,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import new_uuid

if TYPE_CHECKING:
    from app.models.admin import Admin


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    __table_args__ = (
        CheckConstraint(
            "auth_method IN ('password', 'passkey')",
            name="auth_method_valid",
        ),
        CheckConstraint(
            "octet_length(token_hash) = 32",
            name="token_hash_length",
        ),
        CheckConstraint(
            "expires_at > issued_at",
            name="expiry_after_issue",
        ),
        CheckConstraint(
            "replaced_by <> jti",
            name="replaced_by_not_self",
        ),
    )

    jti: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=new_uuid,
    )

    # Revoke-whole-family and reuse-detection queries filter on this.
    family_id: Mapped[uuid.UUID] = mapped_column(index=True)

    # Copied unchanged to every rotated token in the family and never reset.
    # This enforces the absolute session cap.
    family_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    admin_id: Mapped[int] = mapped_column(
        SmallInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Hottest lookup path. unique=True gives the constraint and index.
    token_hash: Mapped[bytes] = mapped_column(
        LargeBinary,
        unique=True,
        nullable=False,
    )

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Indexed for lazy purge:
    # DELETE ... WHERE expires_at < now()
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    # Both stay NULL until explicitly set.
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # SET NULL so lazy purge can delete old rows without
    # breaking the replacement chain.
    replaced_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("refresh_tokens.jti", ondelete="SET NULL"),
        nullable=True,
    )

    auth_method: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
    )

    admin: Mapped["Admin"] = relationship(
        back_populates="refresh_tokens",
        lazy="raise",
    )