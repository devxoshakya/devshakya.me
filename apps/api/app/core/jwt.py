# app/core/jwt.py
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from pydantic import BaseModel

from app.core.config import settings
from app.core.exceptions import Unauthorized


class AccessTokenClaims(BaseModel):
    sub: str
    fid: str
    amr: str
    jti: str
    typ: str
    iat: datetime
    exp: datetime


def issue_access_token(admin_id: int, family_id: str, amr: str) -> str:
    """Issues a short-lived access JWT signed with EdDSA."""
    if not settings.JWT_PRIVATE_KEY:
        raise RuntimeError("JWT_PRIVATE_KEY is not configured.")

    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_TTL_MINUTES)

    payload : dict[str, int | str] = {
        "sub": str(admin_id),
        "fid": family_id,
        "amr": amr,
        "jti": str(uuid.uuid4()),
        "typ": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }

    headers = {"kid": settings.JWT_KID, "alg": "EdDSA"}

    private_key = settings.JWT_PRIVATE_KEY.replace("\\n", "\n")
    return jwt.encode(payload, private_key, algorithm="EdDSA", headers=headers)


def verify_access_token(token: str) -> AccessTokenClaims:
    """Verifies access JWT algorithm, header kid, expiration, and payload structure."""
    if not settings.JWT_PUBLIC_KEY:
        raise RuntimeError("JWT_PUBLIC_KEY is not configured.")

    try:
        header = jwt.get_unverified_header(token)
        if header.get("kid") != settings.JWT_KID:
            raise Unauthorized("Invalid token key identifier.")

        public_key = settings.JWT_PUBLIC_KEY.replace("\\n", "\n")
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["EdDSA"],  # Algorithm explicitly locked in code
            options={"require": ["exp", "iat", "sub", "jti", "typ"]},
            leeway=10,  # 10s clock skew tolerance
        )

        if payload.get("typ") != "access":
            raise Unauthorized("Invalid token type.")

        return AccessTokenClaims(
            sub=payload["sub"],
            fid=payload["fid"],
            amr=payload["amr"],
            jti=payload["jti"],
            typ=payload["typ"],
            iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        )
    except jwt.PyJWTError:
        raise Unauthorized("Invalid or expired authentication token.")
