import uuid

from sqlalchemy import BigInteger, CheckConstraint, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, new_uuid


class Pin(TimestampMixin, Base):
    """Only published pins live here. The upload ticket is in Redis."""

    __tablename__ = "pins"

    __table_args__ = (
        CheckConstraint(
            "char_length(trim(alt_text)) > 0",
            name="alt_text_not_blank",
        ),
        CheckConstraint(
            "link_url IS NULL OR link_url ~* '^https?://'",
            name="link_url_scheme",
        ),
        CheckConstraint(
            "left(object_key, 5) = 'pins/'",
            name="object_key_prefix",
        ),
        CheckConstraint(
            "mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')",
            name="mime_type_allowed",
        ),
        CheckConstraint(
            "bytes > 0",
            name="bytes_positive",
        ),
        CheckConstraint(
            "(width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)",
            name="dimensions_valid",
        ),
    )

    # App-generated UUIDv7. Equal to the pin_id used in the upload ticket.
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=new_uuid,
        nullable=False,
    )

    caption: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    alt_text: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    link_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    # Store only the key. Build the public URL from R2_PUBLIC_BASE_URL + key.
    object_key: Mapped[str] = mapped_column(
        String(512),
        unique=True,
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    # Attribute is size_bytes (avoids shadowing the builtin);
    # database column is "bytes".
    size_bytes: Mapped[int] = mapped_column(
        "bytes",
        BigInteger,
        nullable=False,
    )

    # Needed for grid layout so the page does not jump while images load.
    width: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    height: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )


# Must match:
# ORDER BY created_at DESC, id DESC
#
# so keyset pagination:
# WHERE (created_at, id) < (:created_at, :id)
# can use the index directly.
Index(
    "ix_pins_created_at_id_desc",
    Pin.created_at.desc(),
    Pin.id.desc(),
)
