from pydantic import BaseModel, Field


class PasswordLoginRequest(BaseModel):
    password: str = Field(..., min_length=1)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"


class MeResponse(BaseModel):
    authenticated: bool
    amr: str


class PasskeyRegisterOptionsRequest(BaseModel):
    enrollment_token: str


class PasskeyRegisterVerifyRequest(BaseModel):
    challenge_id: str
    credential_json: str
    label: str | None = None


class PasskeyLoginVerifyRequest(BaseModel):
    challenge_id: str
    credential_json: str
