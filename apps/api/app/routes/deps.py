from fastapi import Depends, Request

from app.core.client_ip import get_client_ip as _get_client_ip
from app.core.config import Settings, get_settings


def get_client_ip(request: Request, settings: Settings = Depends(get_settings)) -> str:
    return _get_client_ip(request, settings.client_ip_header) # type: ignore