from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.core.client_ip import get_client_ip
from app.core.rate_limit import rate_limit
from app.deps import DbSession, RedisClient
from app.schemas.visitors import VisitorOut
from app.services.visitors import VisitorService

router = APIRouter(prefix="/visitors", tags=["visitors"])


def get_visitor_service(
    session: DbSession,
    redis: RedisClient,
) -> VisitorService:
    return VisitorService(session, redis)


# Type aliases for clean signatures
ClientIP = Annotated[str, Depends(get_client_ip)]
VisitorSvc = Annotated[VisitorService, Depends(get_visitor_service)]


@router.post(
    "",
    response_model=VisitorOut,
    summary="Record unique visit & get total",
    dependencies=[Depends(rate_limit("visit"))],
)
async def record_visit(
    request: Request,
    response: Response,
    client_ip: ClientIP,
    service: VisitorSvc,
    
):
    """
    Called exactly once per client page load.
    Idempotent: Refreshing the page safely returns the total without double-counting.
    """
    total = await service.process_visit(request, response, client_ip)
    return {"total_visitors": total}
