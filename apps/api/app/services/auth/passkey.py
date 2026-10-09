# app/services/passkey.py
import hashlib
import json
import secrets
from typing import Any

import webauthn
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from webauthn.helpers import (
    base64url_to_bytes,
    bytes_to_base64url,
    parse_authentication_credential_json,
    parse_registration_credential_json,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from app.core.config import settings
from app.core.exceptions import Unauthorized
from app.models.passkey_credential import PasskeyCredential

ADMIN_USER_ID = b"singleton_admin_user_id_v1"


class PasskeyService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis

    async def generate_enrollment_token(self) -> str:
        """CLI tool helper: generates a single-use enrollment token valid for 10 minutes."""
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        await self.redis.set(
            f"enroll:{token_hash}", "1", ex=settings.ENROLLMENT_TTL_MINUTES * 60
        )
        return token

    async def get_registration_options(self, enrollment_token: str) -> dict[str, Any]:
        """Validates enrollment token and builds WebAuthn registration options."""
        token_hash = hashlib.sha256(enrollment_token.encode("utf-8")).hexdigest()
        if not await self.redis.exists(f"enroll:{token_hash}"):
            raise Unauthorized("Invalid or expired enrollment token.")

        # Retrieve existing credential IDs to prevent duplicate registration
        stmt = select(PasskeyCredential.credential_id)
        existing_ids = (await self.db.execute(stmt)).scalars().all()

        options = webauthn.generate_registration_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            rp_name=settings.WEBAUTHN_RP_NAME,
            user_id=ADMIN_USER_ID,
            user_name="admin",
            user_display_name="Portfolio Admin",
            attestation=AttestationConveyancePreference.NONE,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.REQUIRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
            exclude_credentials=[
                PublicKeyCredentialDescriptor(id=cid)
                for cid in existing_ids
            ]
            if existing_ids
            else None,
        )

        chal_id = secrets.token_urlsafe(16)
        await self.redis.set(
            f"wa:chal:{chal_id}",
            f"enroll|{token_hash}|{bytes_to_base64url(options.challenge)}",
            ex=120,
        )

        options_dict = webauthn.options_to_json(options)
        return {"challenge_id": chal_id, "options": json.loads(options_dict)}

    async def verify_registration(
        self, challenge_id: str, credential_json: str, label: str | None = None
    ) -> PasskeyCredential:
        raw_val = await self.redis.get(f"wa:chal:{challenge_id}")
        if not raw_val:
            raise Unauthorized("Challenge expired or invalid.")
        await self.redis.delete(f"wa:chal:{challenge_id}")

        raw_text = raw_val.decode("utf-8") if isinstance(raw_val, bytes) else raw_val
        purpose, token_hash, expected_challenge = raw_text.split("|", 2)
        if purpose != "enroll":
            raise Unauthorized("Invalid challenge purpose.")

        credential = parse_registration_credential_json(credential_json)
        verification = webauthn.verify_registration_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_rp_id=settings.WEBAUTHN_RP_ID,
            expected_origin=settings.WEBAUTHN_ORIGINS,
            require_user_verification=True,
        )

        db_cred = PasskeyCredential()
        db_cred.admin_id = 1
        db_cred.credential_id = verification.credential_id
        db_cred.public_key = verification.credential_public_key
        db_cred.sign_count = verification.sign_count
        db_cred.transports = [
            str(transport) for transport in (credential.response.transports or [])
        ]
        db_cred.label = label or "Passkey"
        self.db.add(db_cred)
        await self.redis.delete(f"enroll:{token_hash}")
        await self.db.commit()
        return db_cred

    async def get_login_options(self) -> dict[str, Any]:
        options = webauthn.generate_authentication_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            user_verification=UserVerificationRequirement.REQUIRED,
        )
        chal_id = secrets.token_urlsafe(16)
        await self.redis.set(
            f"wa:chal:{chal_id}",
            f"login||{bytes_to_base64url(options.challenge)}",
            ex=120,
        )

        return {"challenge_id": chal_id, "options": json.loads(webauthn.options_to_json(options))}

    async def verify_login(
        self, challenge_id: str, credential_json: str
    ) -> PasskeyCredential:
        raw_val = await self.redis.get(f"wa:chal:{challenge_id}")
        if not raw_val:
            raise Unauthorized("Challenge expired or invalid.")
        await self.redis.delete(f"wa:chal:{challenge_id}")

        raw_text = raw_val.decode("utf-8") if isinstance(raw_val, bytes) else raw_val
        purpose, _, expected_challenge = raw_text.split("|", 2)
        if purpose != "login":
            raise Unauthorized("Invalid challenge purpose.")

        credential = parse_authentication_credential_json(credential_json)
        credential_id = credential.raw_id

        stmt = select(PasskeyCredential).where(
            PasskeyCredential.credential_id == credential_id
        )
        db_cred = (await self.db.execute(stmt)).scalar_one_or_none()
        if not db_cred:
            raise Unauthorized("Invalid credentials.")

        verification = webauthn.verify_authentication_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_rp_id=settings.WEBAUTHN_RP_ID,
            expected_origin=settings.WEBAUTHN_ORIGINS,
            credential_public_key=db_cred.public_key,
            credential_current_sign_count=db_cred.sign_count,
            require_user_verification=True,
        )

        # Clone detection via signature counter check
        if verification.new_sign_count <= db_cred.sign_count and db_cred.sign_count > 0:
            raise Unauthorized("Possible cloned authenticator detected.")

        db_cred.sign_count = verification.new_sign_count
        await self.db.commit()
        return db_cred
