from fastapi import APIRouter, Depends, Request

from app.core.exceptions import NotFound
from app.deps import get_client_ip

router = APIRouter(prefix="/debug")


@router.get("/ip")
async def ip(request: Request, client_ip: str = Depends(get_client_ip)) -> dict[str, str | None]:
    return {
        "detected": client_ip,
        "raw_x_forwarded_for": request.headers.get("x-forwarded-for"),
        "raw_x_real_ip": request.headers.get("x-real-ip"),
        "asgi_client": request.client.host if request.client else None,
    }

@router.get("/boom")
async def boom():
    raise NotFound("Deliberate test error.")


@router.get("/crash")
async def crash():
    raise RuntimeError("secret internals")