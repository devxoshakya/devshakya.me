import uuid
from datetime import datetime
from uuid import uuid7 as _uuid7

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


def new_uuid() -> uuid.UUID:
    """Generate a time-sortable UUIDv7 in the application."""
    return _uuid7()


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class TimestampMixin(CreatedAtMixin):
    # onupdate only fires for ORM-level UPDATEs.
    # Bulk/raw UPDATE statements bypass it, so repositories
    # must explicitly set updated_at when needed.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )