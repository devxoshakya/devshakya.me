import asyncio
import random
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid7

# Keep direct execution (`python cli/seed_pins.py`) working when the API is not
# installed as a package.
if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings
from app.db.engine import create_engine
from app.models.pin import Pin
from sqlalchemy import insert


async def main() -> None:
    engine = create_engine(get_settings().POSTGRES_URL)
    now = datetime.now(UTC)

    rows: list[dict[str, object]] = []

    # 9,000 pins with random timestamps
    for _ in range(9_000):
        created_at = now - timedelta(seconds=random.randint(0, 60 * 60 * 24 * 365))

        rows.append(
            {
                "id": uuid7(),
                "caption": "Seed data",
                "alt_text": "Seed image",
                "link_url": None,
                "object_key": f"pins/{uuid7()}.webp",
                "mime_type": "image/webp",
                "bytes": random.randint(1_000, 3_000_000),
                "width": 1920,
                "height": 1080,
                "created_at": created_at,
                "updated_at": created_at,
            }
        )

    # 1,000 pins with EXACTLY the same timestamp.
    # This tests the (created_at, id) tie-breaker.
    identical_timestamp = now - timedelta(days=30)

    for _ in range(1_000):
        rows.append(
            {
                "id": uuid7(),
                "caption": "Pagination test",
                "alt_text": "Seed image with identical timestamp",
                "link_url": None,
                "object_key": f"pins/{uuid7()}.webp",
                "mime_type": "image/webp",
                "bytes": random.randint(1_000, 3_000_000),
                "width": 1920,
                "height": 1080,
                "created_at": identical_timestamp,
                "updated_at": identical_timestamp,
            }
        )

    try:
        async with engine.begin() as conn:
            await conn.execute(insert(Pin), rows)
    finally:
        await engine.dispose()

    print("Inserted 10,000 pins.")


if __name__ == "__main__":
    asyncio.run(main())
