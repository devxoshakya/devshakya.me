# app/core/csrf.py
from urllib.parse import urlparse

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import Forbidden


async def verify_csrf_protection(request: Request) -> None:
    """
    CSRF Protection layer for cookie-authenticated routes.
    Checks Sec-Fetch-Site, Origin header, and custom headers.
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    # 1. Sec-Fetch-Site Check
    sec_fetch_site = request.headers.get("Sec-Fetch-Site")
    if sec_fetch_site == "cross-site":
        raise Forbidden("Cross-site requests are forbidden.")

    # 2. Origin Check
    origin = request.headers.get("Origin")
    if not origin:
        raise Forbidden("Origin header is required for state-changing requests.")

    parsed_origin = urlparse(origin).geturl()
    if parsed_origin not in settings.WEBAUTHN_ORIGINS:
        raise Forbidden("Unauthorized Origin.")

    # 3. Custom Header Requirement (prevents basic CORS bypass)
    requested_with = request.headers.get("X-Requested-With")
    if not requested_with or requested_with.lower() != "fetch":
        raise Forbidden("X-Requested-With header is required for state-changing requests.")
