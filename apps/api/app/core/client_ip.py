import ipaddress
from urllib.parse import unquote

from starlette.requests import Request

UNKNOWN_IP = "unknown"


def _parse_ip(value: str | None) -> str | None:
    if not value:
        return None

    try:
        ip = ipaddress.ip_address(value.strip())
    except ValueError:
        return None

    # Normalize IPv4-mapped IPv6 (::ffff:1.2.3.4).
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        return str(ip.ipv4_mapped)

    return str(ip)


def get_client_ip(
    request: Request,
    header_name: str = "x-forwarded-for",
) -> str:
    raw = request.headers.get(header_name)

    if raw:
        candidate = _parse_ip(raw.split(",")[-1])
        if candidate:
            return candidate

    client = request.client
    if client:
        fallback = _parse_ip(client.host)
        if fallback:
            return fallback

    return UNKNOWN_IP


def get_client_country(request: Request) -> str | None:
    """Return the two-letter country code, e.g. IN or US."""
    country = request.headers.get("x-vercel-ip-country")

    if not country:
        return None

    country = country.strip().upper()

    if len(country) != 2 or not country.isascii() or not country.isalpha():
        return None

    return country


def get_client_continent(request: Request) -> str | None:
    """Return the continent code, e.g. AS, EU or NA."""
    continent = request.headers.get("x-vercel-ip-continent")

    if not continent:
        return None

    continent = continent.strip().upper()

    if continent not in {"AF", "AN", "AS", "EU", "NA", "OC", "SA"}:
        return None

    return continent


def get_client_location(request: Request) -> dict[str, str | None]:
    """Return available Vercel IP-geolocation metadata."""

    def header(name: str, *, decode: bool = False) -> str | None:
        value = request.headers.get(name)

        if not value:
            return None

        value = value.strip()

        if not value:
            return None

        return unquote(value) if decode else value

    return {
        "city": header("x-vercel-ip-city", decode=True),
        "region": header("x-vercel-ip-country-region"),
        "timezone": header("x-vercel-ip-timezone"),
        "postal_code": header("x-vercel-ip-postal-code"),
        "latitude": header("x-vercel-ip-latitude"),
        "longitude": header("x-vercel-ip-longitude"),
    }
