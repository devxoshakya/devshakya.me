import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.deps import DbSession, get_current_admin, get_pin_service
from app.models.admin import Admin
from app.schemas.pins import (
    PinConfirmRequest,
    PinListResponse,
    PinResponse,
    PinUpdateRequest,
    UploadTicketRequest,
    UploadTicketResponse,
)
from app.services.pins import PinService

router = APIRouter(prefix="/pins", tags=["pins"])

# Annotated Type Aliases using provided dependencies
PinSvc = Annotated[PinService, Depends(get_pin_service)]
CurrentAdmin = Annotated[Admin, Depends(get_current_admin)]


# ------------------------------------------------------------------------------
# Public Endpoints (Served via Cloudflare Worker / CDN)
# ------------------------------------------------------------------------------


@router.get("", response_model=PinListResponse, status_code=status.HTTP_200_OK)
async def list_pins(
    response: Response,
    db: DbSession,
    pin_service: PinSvc,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    cursor: Annotated[str | None, Query()] = None,
) -> PinListResponse:
    """List pins with keyset cursor pagination.

    Response is cached by Cloudflare edge worker (s-maxage=60).
    """
    response.headers["Cache-Control"] = (
        "public, s-maxage=60, stale-while-revalidate=300"
    )
    return await pin_service.list_pins(db, limit=limit, cursor_str=cursor)


@router.get("/{pin_id}", response_model=PinResponse, status_code=status.HTTP_200_OK)
async def get_pin(
    pin_id: uuid.UUID,
    response: Response,
    db: DbSession,
    pin_service: PinSvc,
) -> PinResponse:
    """Fetch single pin details."""
    response.headers["Cache-Control"] = (
        "public, s-maxage=60, stale-while-revalidate=300"
    )
    return await pin_service.get_pin(db, pin_id)


# ------------------------------------------------------------------------------
# Admin Operations (Protected by get_current_admin)
# ------------------------------------------------------------------------------


@router.post(
    "/upload-url",
    response_model=UploadTicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_upload_ticket(
    req: UploadTicketRequest,
    pin_service: PinSvc,
    _: CurrentAdmin,
) -> UploadTicketResponse:
    """Issue a presigned PUT URL and Redis upload ticket (Admin only)."""
    return await pin_service.create_upload_ticket(req)


@router.post(
    "/{pin_id}/confirm",
    response_model=PinResponse,
    status_code=status.HTTP_201_CREATED,
)
async def confirm_pin(
    pin_id: uuid.UUID,
    metadata: PinConfirmRequest,
    db: DbSession,
    pin_service: PinSvc,
    _: CurrentAdmin,
) -> PinResponse:
    """Verify uploaded R2 object via HEAD + magic bytes, copy to permanent prefix,

    and insert DB row (Admin only).
    """
    return await pin_service.confirm_pin(db, pin_id, metadata)


@router.patch("/{pin_id}", response_model=PinResponse, status_code=status.HTTP_200_OK)
async def update_pin(
    pin_id: uuid.UUID,
    patch: PinUpdateRequest,
    db: DbSession,
    pin_service: PinSvc,
    _: CurrentAdmin,
) -> PinResponse:
    """Update pin metadata (Admin only)."""
    return await pin_service.update_pin(db, pin_id, patch)


@router.delete("/{pin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pin(
    pin_id: uuid.UUID,
    db: DbSession,
    pin_service: PinSvc,
    _: CurrentAdmin,
) -> None:
    """Delete DB record and underlying storage object (Admin only)."""
    await pin_service.delete_pin(db, pin_id)
