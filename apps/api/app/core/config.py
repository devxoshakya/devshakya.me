from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    POSTGRES_URL: str
    REDIS_URL: str
    WAKATIME_API_KEY: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    CLIENT_IP_HEADER: str = "x-forwarded-for"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    APP_ENV: str = "dev"
    RATE_LIMIT_HMAC_SECRET: SecretStr
    VISITOR_PEPPER : SecretStr
    PASSWORD_PEPPER : SecretStr


settings = Settings()  # type: ignore[reportCallIssue]


def get_settings() -> Settings:
    return settings
