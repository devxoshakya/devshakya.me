from fastapi import APIRouter

from app.routes import health, visitors  # import the new module

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(visitors.router)  # register it
