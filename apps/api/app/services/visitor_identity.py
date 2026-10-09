import hashlib
import hmac
import uuid

from fastapi import Request

from app.core.config import settings


def generate_vid() -> str:
    return str(uuid.uuid4())


def parse_vid(cookie_value: str | None) -> str | None:
    if not cookie_value:
        return None
    try:
        # Strict validation: throws ValueError if invalid
        val = uuid.UUID(cookie_value, version=4)
        return str(val)
    except ValueError:
        return None


def hash_vid(uuid_str: str) -> bytes:
    """HMAC-SHA256(pepper, uuid). returns 32 raw bytes."""
    return hmac.new(
        settings.VISITOR_PEPPER.get_secret_value().encode("utf-8"),
        uuid_str.encode("utf-8"),
        hashlib.sha256,
    ).digest()


def is_bot(request: Request) -> bool:
    """Best effort filter for honest crawlers and lazy scripts."""
    ua = request.headers.get("user-agent", "").lower()
    if not ua:
        return True

    bot_substrings = ["bot", "crawler", "spider", "curl", "python-requests", "headless"]
    if any(b in ua for b in bot_substrings):
        return True

    # Check Sec-Fetch-Site if present
    sec_fetch = request.headers.get("sec-fetch-site")
    return bool(sec_fetch and sec_fetch not in ["same-origin", "same-site"])
