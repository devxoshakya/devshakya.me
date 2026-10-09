import logging
import math
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.request_context import get_request_id

logger = logging.getLogger(__name__)


class AppError(Exception):
    status_code: int = 500
    code: str = "internal_error"
    message: str = "Something went wrong."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: list[dict[str, Any]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.message = message or self.message
        self.code = code or self.code
        self.details = details
        self.headers = headers
        super().__init__(self.message)


class NotFound(AppError):
    status_code = 404
    code = "not_found"
    message = "Resource not found."


class Unauthorized(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Authentication required."


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"
    message = "You do not have access to this resource."


class Conflict(AppError):
    status_code = 409
    code = "conflict"
    message = "Request conflicts with the current state."


class ValidationFailed(AppError):
    status_code = 422
    code = "validation_failed"
    message = "Request validation failed."


class RateLimited(AppError):
    status_code = 429
    code = "rate_limited"
    message = "Too many requests."

    def __init__(
        self,
        retry_after: float,
        message: str | None = None,
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        seconds = max(1, math.ceil(retry_after))
        super().__init__(
            message,
            headers={"Retry-After": str(seconds), **(headers or {})},
        )


class ServiceUnavailable(AppError):
    status_code = 503
    code = "service_unavailable"
    message = "Service temporarily unavailable."


def _error_response(
    status_code: int,
    code: str,
    message: str,
    *,
    details: list[dict[str, Any]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    request_id = get_request_id()
    error: dict[str, Any] = {"code": code, "message": message, "request_id": request_id}
    if details:
        error["details"] = details

    out_headers = dict(headers or {})
    if request_id:
        # Unhandled-exception responses bypass the request ID middleware,
        # so set the header here as well.
        out_headers["X-Request-ID"] = request_id

    return JSONResponse(status_code=status_code, content={"error": error}, headers=out_headers)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return _error_response(
        exc.status_code, exc.code, exc.message, details=exc.details, headers=exc.headers
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    codes = {404: "not_found", 405: "method_not_allowed"}
    code = codes.get(exc.status_code, f"http_{exc.status_code}")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed." # type: ignore
    return _error_response(exc.status_code, code, message, headers=dict(exc.headers or {}))


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Only loc and msg are exposed. "input" and "ctx" can echo user data or internals.
    details = [{"loc": list(e["loc"]), "msg": e["msg"]} for e in exc.errors()] # type: ignore
    return _error_response(
        422, "validation_failed", "Request validation failed.", details=details # type: ignore
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_exception", extra={"path": request.url.path})
    return _error_response(500, "internal_error", "Something went wrong.")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)