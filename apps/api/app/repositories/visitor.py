from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.visitor import Visitor


class VisitorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def insert_if_absent(self, vid_hash_bytes: bytes) -> bool:
        """Returns True if a new row was created, False if it already existed."""
        stmt = (
            insert(Visitor)
            .values(vid_hash=vid_hash_bytes)
            .on_conflict_do_nothing()
            .returning(Visitor.vid_hash)  # Ask Postgres to return the inserted hash
        )

        result = await self.session.execute(stmt)
        inserted_hash = result.scalar_one_or_none()

        await self.session.commit()

        # If inserted_hash is not None, a new row was actually created
        return inserted_hash is not None

    async def count_all(self) -> int:
        """Exact count from the source of truth."""
        stmt = select(func.count()).select_from(Visitor)
        result = await self.session.scalar(stmt)
        return result or 0
