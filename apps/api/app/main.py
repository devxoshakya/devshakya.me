import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import debug
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

        yield

    finally:
        if redis is not None:
            await redis.aclose()

        await engine.dispose()


def create_app() -> FastAPI:

    is_prod = settings.APP_ENV == "prod"

    app = FastAPI(
        title="Portfolio API",
        lifespan=lifespan,
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else "/openapi.json",
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

    if not is_prod:
        api_v1 = APIRouter(prefix="/api/v1")
        api_v1.include_router(debug.router)
        app.include_router(api_v1)
    app.include_router(API_ROUTER)

    return app


app = create_app()
