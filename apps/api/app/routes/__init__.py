from fastapi import APIRouter

from app.routes import health, visitors, auth, pins  # import the new module

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(visitors.router)  # register it
api_router.include_router(auth.router)  # register it
api_router.include_router(pins.router)  # register it