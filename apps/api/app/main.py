import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import Theme, get_scalar_api_reference  # type: ignore

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.rate_limit.limiter import RateLimiter
from app.db.engine import create_engine
from app.db.redis import create_redis
from app.db.session import create_session_factory
from app.middlewares.request_id import RequestIDMiddleware
from app.routes import api_router as API_ROUTER

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_engine(settings.POSTGRES_URL)
    redis = None

    try:
        redis = create_redis(settings.REDIS_URL)

        app.state.engine = engine
        app.state.session_factory = create_session_factory(engine)
        app.state.redis = redis

        app.state.rate_limiter = RateLimiter(
            redis=redis,
            hmac_secret=(
                settings.RATE_LIMIT_HMAC_SECRET.get_secret_value().encode("utf-8")
            ),
        )
        app.state.http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=3.0) 
        )
        yield

    finally:
        if redis is not None:
            await redis.aclose()
        await app.state.http_client.aclose()
        await engine.dispose()


def create_app() -> FastAPI:

    app = FastAPI(
        title="Portfolio API",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        swagger_ui_parameters={
            "requestSnippetsEnabled": True,
        },
    )

    register_exception_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,  # list from env, exact origins, no "*"
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Request-ID",
            "X-Requested-With",
            "*",
        ],
        expose_headers=[
            "X-Request-ID",
            "Retry-After",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
        ],
        max_age=600,
    )
    app.add_middleware(RequestIDMiddleware)
    app.include_router(API_ROUTER)
    
    
    @app.get("/docs", include_in_schema=False)
    async def scalar_html():
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=app.title + " - API Reference",
            theme=Theme.MARS,
        )

    @app.get("/")
    def read_root():
        return {"message": "Hello World"}

    return app


app = create_app()
