import hashlib
import hmac
import ipaddress


class ClientIdentityError(ValueError):
    """Raised when the client IP cannot be safely normalized."""


def normalize_client_ip(raw_ip: str) -> str:
    try:
        address = ipaddress.ip_address(raw_ip.strip())
    except (ValueError, AttributeError) as exc:
        raise ClientIdentityError("Invalid client IP address") from exc

    # Normalize IPv4-mapped IPv6 addresses to IPv4.
    if isinstance(address, ipaddress.IPv6Address):
        mapped = address.ipv4_mapped
        if mapped is not None:
            address = mapped

    if isinstance(address, ipaddress.IPv6Address):
        network = ipaddress.ip_network(
            f"{address.compressed}/64",
            strict=False,
        )
        return network.with_prefixlen

    return address.compressed


def hash_client_ip(
    raw_ip: str,
    secret: bytes,
) -> str:
    if len(secret) < 32:
        raise ValueError("Rate-limit HMAC secret must be at least 32 bytes")

    normalized_ip = normalize_client_ip(raw_ip)

    return hmac.new(
        secret,
        normalized_ip.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()[:32]


def make_bucket_key(
    group: str,
    raw_ip: str,
    secret: bytes,
) -> str:
    digest = hash_client_ip(raw_ip, secret)

    return f"rl:{group}:{digest}"
