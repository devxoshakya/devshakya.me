# app/services/auth.py
import hashlib
import hmac

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi.concurrency import run_in_threadpool

from app.core.config import settings

# Configure Argon2id hasher based on settings
ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=2,
)

# Dummy hash generated once at startup to mitigate timing attacks
# when verifying a password against a non-existent admin row.
_DUMMY_PASSWORD = "dummy_password_for_timing"
DUMMY_HASH = ph.hash(_DUMMY_PASSWORD)


def _apply_pepper(password: str) -> str:
    """Mixes a secret pepper into the password before hashing."""
    if not settings.PASSWORD_PEPPER:
        return password

    return hmac.new(
        settings.PASSWORD_PEPPER.get_secret_value().encode("utf-8"),
        password.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


async def hash_password(password: str) -> str:
    """Hashes a password using Argon2id, applying the pepper if configured. Runs in threadpool."""
    peppered = _apply_pepper(password)
    # Hashing is CPU-bound and slow by design, run in threadpool so we don't block the async event loop
    return await run_in_threadpool(ph.hash, peppered)


async def verify_password(password: str, hashed: str | None) -> bool:
    """
    Verifies a password. If `hashed` is None, verifies against a dummy hash
    to ensure the function takes the same amount of time, preventing existence leaks.
    """
    try:
        if hashed is None:
            # Timing attack mitigation path
            await run_in_threadpool(ph.verify, DUMMY_HASH, _DUMMY_PASSWORD)
            return False

        peppered = _apply_pepper(password)
        return await run_in_threadpool(ph.verify, hashed, peppered)
    except VerifyMismatchError:
        return False


def needs_rehash(hash_str: str) -> bool:
    """Checks if the hash parameters have changed and the password should be rehashed."""
    return ph.check_needs_rehash(hash_str)
