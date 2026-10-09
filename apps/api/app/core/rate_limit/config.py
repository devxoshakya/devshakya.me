from dataclasses import dataclass
from types import MappingProxyType
from typing import Final, Literal

FailureMode = Literal["open", "closed"]


@dataclass(frozen=True, slots=True)
class RateLimitPolicy:
    capacity: int
    refill_period_ms: int
    failure_mode: FailureMode


POLICIES: Final = MappingProxyType(
    {
        "read": RateLimitPolicy(
            capacity=60,
            refill_period_ms=1_000,
            failure_mode="open",
        ),
        "visit": RateLimitPolicy(
            capacity=5,
            refill_period_ms=60_000,
            failure_mode="open",
        ),
        "waka": RateLimitPolicy(
            capacity=20,
            refill_period_ms=5_000,
            failure_mode="open",
        ),
        "login": RateLimitPolicy(
            capacity=5,
            refill_period_ms=180_000,
            failure_mode="closed",
        ),
        "refresh": RateLimitPolicy(
            capacity=10,
            refill_period_ms=10_000,
            failure_mode="closed",
        ),
        "upload": RateLimitPolicy(
            capacity=10,
            refill_period_ms=30_000,
            failure_mode="closed",
        ),
        "passkey": RateLimitPolicy(
            capacity=10,
            refill_period_ms=30_000,
            failure_mode="closed",
        ),
    }
)

TOKEN_SCALE: Final = 1_000
TTL_BUFFER_MS: Final = 60_000
REDIS_TIMEOUT_SECONDS: Final = 0.75


def validate_policies() -> None:
    for name, policy in POLICIES.items():
        if policy.capacity < 1:
            raise ValueError(f"{name}: capacity must be positive")

        if policy.refill_period_ms < 1:
            raise ValueError(f"{name}: refill period must be positive")


validate_policies()
