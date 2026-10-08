import re
from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.request_context import set_request_id

_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


class RequestIDMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id: str | None = None

        for name, value in scope["headers"]:
            if name == b"x-request-id":
                try:
                    candidate = value.decode("ascii")
                except UnicodeDecodeError:
                    candidate = ""

                if _REQUEST_ID_PATTERN.fullmatch(candidate):
                    request_id = candidate

                break

        if request_id is None:
            request_id = uuid4().hex

        set_request_id(request_id)

        async def send_with_request_id(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Request-ID"] = request_id

            await send(message)

        await self.app(scope, receive, send_with_request_id)