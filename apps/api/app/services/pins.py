import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import TypedDict, cast

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BadRequest, Conflict, NotFound, ValidationFailed
from app.core.redis_lock import RedisLock
from app.db.mixins import new_uuid
from app.models.pin import Pin
from app.repositories.pin import PinRepository
from app.schemas.pins import (
    ALLOWED_MIME_TYPES,
    PinConfirmRequest,
    PinListResponse,
    PinResponse,
    PinUpdateRequest,
    UploadTicketRequest,
    UploadTicketResponse,
)
from app.services.image_sniff import sniff_image_type
from app.services.pagination import decode_cursor
from app.services.storage import StorageService


class UploadTicketData(TypedDict):
    pin_id: str
    mime_type: str
    size_bytes: int
    key: str
    ext: str
    width: int | None
    height: int | None
    blur_hash: str | None


class PinService:
    def __init__(
        self,
        redis: Redis,
        storage: StorageService,
        pin_repo: PinRepository,
    ):
        self.redis = redis
        self.storage = storage
        self.repo = pin_repo

    async def create_upload_ticket(
        self, req: UploadTicketRequest
    ) -> UploadTicketResponse:
        if req.size_bytes > settings.PIN_MAX_BYTES:
            raise BadRequest(
                f"File size exceeds maximum threshold of {settings.PIN_MAX_BYTES} bytes"
            )

        pin_id = new_uuid()
        ext = ALLOWED_MIME_TYPES[req.mime_type]
        pending_key = f"pending/{pin_id}.{ext}"

        ticket_data: UploadTicketData = {
            "pin_id": str(pin_id),
            "mime_type": req.mime_type,
            "size_bytes": req.size_bytes,
            "key": pending_key,
            "ext": ext,
            "blur_hash": req.blur_hash,
            "width": req.width,
            "height": req.height,
        }

        # Store ticket in Redis with 15-minute TTL
        redis_key = f"pin:upload:{pin_id}"
        await self.redis.set(redis_key, json.dumps(ticket_data), ex=900)

        # Generate Presigned PUT URL (600s TTL)
        upload_url = await self.storage.presign_put(
            key=pending_key,
            content_type=req.mime_type,
            content_length=req.size_bytes,
            expires_in=600,
        )

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=600)

        return UploadTicketResponse(
            pin_id=pin_id,
            upload_url=upload_url,
            headers={"Content-Type": req.mime_type},
            expires_at=expires_at,
        )

    async def confirm_pin(
        self,
        session: AsyncSession,
        pin_id: uuid.UUID,
        metadata: PinConfirmRequest,
    ) -> PinResponse:
        # 1. Idempotency Check
        existing = await self.repo.get(session, pin_id)
        if existing:
            return self._to_response(existing)

        # 2. Load Upload Ticket
        redis_key = f"pin:upload:{pin_id}"
        raw_ticket = await self.redis.get(redis_key)
        if not raw_ticket:
            raise NotFound("Upload ticket expired or does not exist")
        ticket: UploadTicketData = cast(
            UploadTicketData,
            json.loads(raw_ticket),
        )

        # 3. Lock Acquisition
        lock_key = f"pin:confirm:{pin_id}"
        lock = RedisLock(self.redis, lock_key, ttl_seconds=30)
        if not await lock.acquire():
            raise Conflict("Pin confirm operation is currently in progress")

        try:
            # 4. Re-check DB after acquiring lock
            existing = await self.repo.get(session, pin_id)
            if existing:
                return self._to_response(existing)

            pending_key = ticket["key"]

            # 5. HEAD Check on Pending R2 Object
            head_info = await self.storage.head(pending_key)
            if not head_info:
                raise ValidationFailed(
                    "Uploaded object not found in storage", code="OBJECT_NOT_FOUND"
                )

            if head_info["size"] != ticket["size_bytes"]:
                await self._cleanup_failed_upload(pending_key, redis_key)
                raise ValidationFailed(
                    "Uploaded size does not match ticket declaration",
                    code="SIZE_MISMATCH",
                )

            if head_info["size"] > settings.PIN_MAX_BYTES:
                await self._cleanup_failed_upload(pending_key, redis_key)
                raise ValidationFailed(
                    "Uploaded file size exceeds maximum permitted", code="SIZE_EXCEEDED"
                )

            # 6. Magic Bytes Range GET Verification
            head_bytes = await self.storage.read_range(pending_key, 0, 31)
            sniffed_mime = sniff_image_type(head_bytes)
            if sniffed_mime != ticket["mime_type"]:
                await self._cleanup_failed_upload(pending_key, redis_key)
                raise ValidationFailed(
                    "File contents do not match declared MIME type",
                    code="MAGIC_BYTES_MISMATCH",
                )

            # 7. Copy to Permanent Path (pins/{pin_id}/original.{ext})
            permanent_key = f"pins/{pin_id}.{ticket['ext']}"
            await self.storage.copy(
                src_key=pending_key,
                dst_key=permanent_key,
                content_type=ticket["mime_type"],
                cache_control="public, max-age=31536000, immutable",
            )

            resolved_blur_hash = metadata.blur_hash or ticket.get("blur_hash")
            
            # 8. Create DB Row
            pin = Pin()
            pin.id = pin_id
            pin.caption = metadata.caption
            pin.alt_text = metadata.alt_text
            pin.link_url = metadata.link_url
            pin.object_key = permanent_key
            pin.mime_type = ticket["mime_type"]
            pin.size_bytes = ticket["size_bytes"]
            pin.width = ticket["width"]
            pin.height = ticket["height"]
            pin.blur_hash = resolved_blur_hash
            created_pin = await self.repo.insert(session, pin)

            # 9. Best-effort cleanup of pending object and ticket
            await self.storage.delete(pending_key)
            await self.redis.delete(redis_key)

            return self._to_response(created_pin)

        finally:
            await lock.release()

    async def update_pin(
        self,
        session: AsyncSession,
        pin_id: uuid.UUID,
        patch: PinUpdateRequest,
    ) -> PinResponse:
        pin = await self.repo.get(session, pin_id)
        if not pin:
            raise NotFound("Pin not found")

        patch_data = patch.model_dump(exclude_unset=True)
        if not patch_data:
            return self._to_response(pin)

        updated_pin = await self.repo.update(session, pin, patch_data)
        return self._to_response(updated_pin)

    async def delete_pin(self, session: AsyncSession, pin_id: uuid.UUID) -> None:
        # Hard delete ordering: DB row first, then object in storage
        object_key = await self.repo.delete(session, pin_id)
        if not object_key:
            raise NotFound("Pin not found")

        # Best-effort storage deletion
        await self.storage.delete(object_key)

    async def get_pin(self, session: AsyncSession, pin_id: uuid.UUID) -> PinResponse:
        pin = await self.repo.get(session, pin_id)
        if not pin:
            raise NotFound("Pin not found")
        return self._to_response(pin)

    async def list_pins(
        self,
        session: AsyncSession,
        limit: int = 20,
        cursor_str: str | None = None,
    ) -> PinListResponse:
        parsed_cursor = decode_cursor(cursor_str) if cursor_str else None
        pins, next_cursor = await self.repo.list_page(
            session, limit=limit, cursor=parsed_cursor
        )
        items = [self._to_response(p) for p in pins]
        return PinListResponse(items=items, next_cursor=next_cursor)

    async def _cleanup_failed_upload(self, pending_key: str, redis_key: str):
        await self.storage.delete(pending_key)
        await self.redis.delete(redis_key)

    def _to_response(self, pin: Pin) -> PinResponse:
        base_url = settings.R2_PUBLIC_BASE_URL.rstrip("/")
        image_url = f"{base_url}/{pin.object_key}"
        cdn_url = f"https://cdn2.devxoshakya.xyz/{pin.object_key}"
        return PinResponse(
            id=pin.id,
            caption=pin.caption,
            alt_text=pin.alt_text,
            link_url=pin.link_url,
            image_url=image_url,
            cdn_url=cdn_url,
            mime_type=pin.mime_type,
            size_bytes=pin.size_bytes,
            blur_hash=pin.blur_hash,
            width=pin.width,
            height=pin.height,
            created_at=pin.created_at,
            updated_at=pin.updated_at,
        )
