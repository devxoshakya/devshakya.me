from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, SmallInteger, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.passkey_credential import PasskeyCredential
    from app.models.refresh_token import RefreshToken


class Admin(TimestampMixin, Base):
    """Singleton table: the database itself allows exactly one row (id = 1)."""

    __tablename__ = "admins"
    __table_args__ = (CheckConstraint("id = 1", name="singleton"),)

    # PK uniqueness + CHECK (id = 1) means a second admin is impossible.
    id: Mapped[int] = mapped_column(
        SmallInteger,
        primary_key=True,
        autoincrement=False,
        default=1,
        server_default=text("1"),
    )
    password_hash: Mapped[str] = mapped_column(Text)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # lazy="raise": an accidental lazy load in async code fails loudly instead of
    # throwing MissingGreenlet. Load explicitly with selectinload() when needed.
    # passive_deletes: the database ON DELETE CASCADE does the work.
    passkeys: Mapped[list["PasskeyCredential"]] = relationship(
        back_populates="admin", passive_deletes=True, lazy="raise"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="admin", passive_deletes=True, lazy="raise"
    )
