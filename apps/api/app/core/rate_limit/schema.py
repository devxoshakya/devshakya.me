from pydantic import BaseModel, ConfigDict, Field


class RateLimitResult(BaseModel):
    """Result returned by the rate limiter."""

    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )

    allowed: bool
    limit: int = Field(ge=1)
    remaining: int = Field(ge=0)
    retry_after_ms: int = Field(ge=0)
