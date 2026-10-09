import unicodedata
from urllib.parse import urlparse


def clean_text(value: str, *, allow_newlines: bool = False) -> str:
    """Strips ASCII/Unicode control characters and trims outer whitespace."""
    if not value:
        return ""
    keep : set[str] = {"\n", "\t"} if allow_newlines else set()
    out = "".join(ch for ch in value if ch in keep or unicodedata.category(ch) != "Cc")
    return out.strip()


def validate_http_url(value: str, max_len: int = 2048) -> str:
    """Validates HTTP/HTTPS URL scheme, netloc, and max length."""
    if not value:
        return value
    value = clean_text(value)
    if len(value) > max_len:
        raise ValueError("URL exceeds maximum length of 2048 characters")
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("Only valid http and https URLs are allowed")
    return value
