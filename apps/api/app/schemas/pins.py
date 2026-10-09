import uuid
from datetime import datetime
from typing import Self

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core.text import clean_text, validate_http_url

ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
}


class UploadTicketRequest(BaseModel):
    mime_type: str = Field(..., description="Target image MIME type")
    size_bytes: int = Field(..., gt=0, description="Expected file size in bytes")
    width: int | None = Field(None, ge=1, le=20000)
    height: int | None = Field(None, ge=1, le=20000)
    blur_hash: str | None = Field(None, max_length=100)  # Optional at ticket stage

    @field_validator("mime_type")
    @classmethod
    def validate_mime(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ALLOWED_MIME_TYPES:
            raise ValueError(f"MIME type '{v}' is not supported")
        return v

    @model_validator(mode="after")
    def validate_dimensions(self) -> Self:
        if (self.width is None) != (self.height is None):
            raise ValueError(
                "Both width and height must be provided together or omitted"
            )
        return self


class UploadTicketResponse(BaseModel):
    pin_id: uuid.UUID
    upload_url: str
    headers: dict[str, str]
    expires_at: datetime


class PinConfirmRequest(BaseModel):
    caption: str | None = Field(None, max_length=1000)
    alt_text: str = Field(..., min_length=1, max_length=500)
    link_url: str | None = Field(None, max_length=2048)
    blur_hash: str | None = Field(None, max_length=100)  # Main client payload field

    @field_validator("alt_text")
    @classmethod
    def validate_alt_text(cls, v: str) -> str:
        cleaned = clean_text(v)
        if not cleaned:
            raise ValueError("alt_text cannot be blank or contain only whitespace")
        return cleaned

    @field_validator("caption")
    @classmethod
    def validate_caption(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = clean_text(v, allow_newlines=True)
        return cleaned if cleaned else None

    @field_validator("link_url")
    @classmethod
    def validate_link(cls, v: str | None) -> str | None:
        if not v:
            return None
        return validate_http_url(v)


class PinUpdateRequest(BaseModel):
    caption: str | None = Field(None, max_length=1000)
    alt_text: str | None = Field(None, min_length=1, max_length=500)
    link_url: str | None = Field(None, max_length=2048)
    blur_hash: str | None = Field(None, max_length=100)

    @field_validator("alt_text")
    @classmethod
    def validate_alt_text(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = clean_text(v)
        if not cleaned:
            raise ValueError("alt_text cannot be updated to a blank string")
        return cleaned

    @field_validator("caption")
    @classmethod
    def validate_caption(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return clean_text(v, allow_newlines=True)

    @field_validator("link_url")
    @classmethod
    def validate_link(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if v == "":
            return None
        return validate_http_url(v)


class PinResponse(BaseModel):
    id: uuid.UUID
    caption: str | None
    alt_text: str
    link_url: str | None
    image_url: str
    mime_type: str
    blur_hash: str | None  # Returned to client for blurred preview placeholder
    cdn_url: str
    size_bytes: int
    width: int | None
    height: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PinListResponse(BaseModel):
    items: list[PinResponse]
    next_cursor: str | None
