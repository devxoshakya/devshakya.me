from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, LargeBinary, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Visitor(Base):
    """All-time unique visitors. The primary key IS the dedupe mechanism:
    INSERT ... ON CONFLICT DO NOTHING tells you whether the visitor is new.
    No other indexes are needed.
    """

    __tablename__ = "visitors"

    __table_args__ = (
        CheckConstraint(
            "octet_length(vid_hash) = 32",
            name="vid_hash_length",
        ),
    )

    # HMAC-SHA256(pepper, uuid).digest(): 32 raw bytes, half the size of hex.
    # Hex-encode it only where a string is required (the Redis set).
    vid_hash: Mapped[bytes] = mapped_column(
        LargeBinary,
        primary_key=True,
        nullable=False,
    )

    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
