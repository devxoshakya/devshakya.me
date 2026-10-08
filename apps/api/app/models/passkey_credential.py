import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    LargeBinary,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import CreatedAtMixin, new_uuid

if TYPE_CHECKING:
    from app.models.admin import Admin


class PasskeyCredential(CreatedAtMixin, Base):
    __tablename__ = "passkey_credentials"
    __table_args__ = (
        # WebAuthn credential IDs are at most 1023 bytes.
        CheckConstraint(
            "octet_length(credential_id) BETWEEN 1 AND 1023",
            name="credential_id_length",
        ),
        CheckConstraint("sign_count >= 0", name="sign_count_non_negative"),
        CheckConstraint("char_length(trim(label)) > 0", name="label_not_blank"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=new_uuid)

    admin_id: Mapped[int] = mapped_column(
        SmallInteger,
        ForeignKey("admins.id", ondelete="CASCADE"),
        index=True,
    )

    # Raw bytes, never base64 in the database. Base64url is only for transport.
    # unique=True creates the unique constraint AND the index used by the
    # usernameless login lookup, so no second index is needed.
    credential_id: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    public_key: Mapped[bytes] = mapped_column(LargeBinary)

    # bigint: some authenticators use large counters. Synced passkeys often stay
    # at 0, so only fail a login when the counter goes DOWN and is non-zero.
    sign_count: Mapped[int] = mapped_column(
        BigInteger, default=0, server_default=text("0")
    )

    transports: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list, server_default=text("'{}'::text[]")
    )
    label: Mapped[str] = mapped_column(String(64), default="passkey")
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    admin: Mapped["Admin"] = relationship(back_populates="passkeys", lazy="raise")
