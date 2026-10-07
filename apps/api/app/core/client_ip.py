import ipaddress

from starlette.requests import Request

UNKNOWN_IP = "unknown"


def _parse_ip(value: str | None) -> str | None:
    if not value:
        return None
    try:
        ip = ipaddress.ip_address(value.strip())
    except ValueError:
        return None
    # Normalize IPv4-mapped IPv6 (::ffff:1.2.3.4) so one client is one identity.
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        return str(ip.ipv4_mapped)
    return str(ip)


def get_client_ip(request: Request, header_name: str = "x-forwarded-for") -> str:
    raw = request.headers.get(header_name)
    if raw:
        # Rightmost entry: the one added or set by the platform proxy.
        # If Vercel overwrites the header there is only one entry anyway.
        # If it appends, anything to the left is client-supplied and untrusted.
        candidate = _parse_ip(raw.split(",")[-1])
        if candidate:
            return candidate

    client = request.client
    if client:
        fallback = _parse_ip(client.host)
        if fallback:
            return fallback

    return UNKNOWN_IP