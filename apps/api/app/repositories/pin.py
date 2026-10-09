import uuid
from collections.abc import Mapping
from datetime import datetime

from sqlalchemy import select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pin import Pin
from app.services.pagination import encode_cursor


class PinRepository:
    async def get(self, session: AsyncSession, pin_id: uuid.UUID) -> Pin | None:
        stmt = select(Pin).where(Pin.id == pin_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def insert(self, session: AsyncSession, pin: Pin) -> Pin:
        session.add(pin)
        await session.commit()
        await session.refresh(pin)
        return pin

    async def update(
        self,
        session: AsyncSession,
        pin: Pin,
        patch_data: Mapping[str, object],
    ) -> Pin:
        for key, value in patch_data.items():
            setattr(pin, key, value)
        await session.commit()
        await session.refresh(pin)
        return pin

    async def delete(self, session: AsyncSession, pin_id: uuid.UUID) -> str | None:
        pin = await self.get(session, pin_id)
        if not pin:
            return None
        object_key = pin.object_key
        await session.delete(pin)
        await session.commit()
        return object_key

    async def list_page(
        self,
        session: AsyncSession,
        limit: int,
        cursor: tuple[datetime, uuid.UUID] | None = None,
    ) -> tuple[list[Pin], str | None]:
        # Keyset pagination ordering by created_at DESC, id DESC
        stmt = (
            select(Pin).order_by(Pin.created_at.desc(), Pin.id.desc()).limit(limit + 1)
        )

        if cursor:
            c_at, c_id = cursor
            stmt = stmt.where(tuple_(Pin.created_at, Pin.id) < tuple_(c_at, c_id))

        res = await session.execute(stmt)
        rows = list(res.scalars().all())

        has_more = len(rows) > limit
        rows = rows[:limit]

        next_cursor = None
        if has_more and rows:
            last_item = rows[-1]
            next_cursor = encode_cursor(last_item.created_at, last_item.id)

        return rows, next_cursor
