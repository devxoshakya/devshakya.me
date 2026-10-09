import base64
import json
import uuid
from datetime import datetime, timedelta, timezone

from app.core.exceptions import BadRequest

_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)
_MICRO = timedelta(microseconds=1)


def encode_cursor(created_at: datetime, pin_id: uuid.UUID) -> str:
    """Encodes created_at timestamp (microsecond precision integer) and pin_id into opaque Base64 URL cursor."""
    micros = (created_at.astimezone(timezone.utc) - _EPOCH) // _MICRO
    raw = json.dumps({"c": micros, "i": str(pin_id)}, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(value: str) -> tuple[datetime, uuid.UUID]:
    """Decodes opaque base64url cursor back into microsecond datetime and UUID."""
    try:
        padded = value + "=" * (-len(value) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode()))
        if set(data.keys()) != {"c", "i"} or not isinstance(data["c"], int):
            raise ValueError
        if not (0 <= data["c"] < 10**18):
            raise ValueError
        created_at = _EPOCH + data["c"] * _MICRO
        pin_id = uuid.UUID(data["i"])
        return created_at, pin_id
    except Exception:  # noqa: BLE001
        raise BadRequest("Invalid or tampered cursor")
