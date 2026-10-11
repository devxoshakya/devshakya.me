
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    POSTGRES_URL: str
    REDIS_URL: str
    R2_ACCESS_KEY_ID: str
    R2_BUCKET : str
    R2_ACCOUNT_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_PUBLIC_BASE_URL : str
    CLIENT_IP_HEADER: str = "x-forwarded-for"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    APP_ENV: str = "dev"
    RATE_LIMIT_HMAC_SECRET: SecretStr
    VISITOR_PEPPER : SecretStr
    PASSWORD_PEPPER : SecretStr
    # --- JWT Settings ---
    # Generate EdDSA or ES256 keys and store them in .env
    JWT_PRIVATE_KEY: str | None = None
    JWT_PUBLIC_KEY: str | None = None
    JWT_KID: str = "v1-eddsa"
    ACCESS_TOKEN_TTL_MINUTES: int = 10
    REFRESH_TOKEN_TTL_DAYS: int = 14
    SESSION_MAX_DAYS: int = 30
    
    # --- WebAuthn Settings ---
    WEBAUTHN_RP_ID: str = "localhost" # Change to devexoshakya.xyz in prod
    WEBAUTHN_RP_NAME: str = "Portfolio Admin"
    WEBAUTHN_ORIGINS: list[str] = ["http://localhost:5500", "http://localhost:3000", "http://localhost:8000"]
    ENROLLMENT_TTL_MINUTES: int = 10
    
    # --- Pins ----
    PIN_MAX_BYTES: int = 15 * 1024 * 1024  # 5 MB
    
    # wakatime & github settings
    WAKATIME_API_KEY: str
    WAKATIME_TIMEZONE: str = "UTC"
    GITHUB_USERNAME: str = "devxoshakya"
    GITHUB_TOKEN: str | None = None
    
    WAKA_FRESH_TTL_SEC: int = 120        # 2 mins
    WAKA_STALE_TTL_SEC: int = 86400      # 24 hours
    GH_FRESH_TTL_SEC: int = 3600         # 1 hour
    GH_STALE_TTL_SEC: int = 604800       # 7 days
    
    WAKA_ACTIVE_WINDOW_SEC: int = 600    # 10 mins


settings = Settings()  # type: ignore[reportCallIssue]


def get_settings() -> Settings:
    return settings
