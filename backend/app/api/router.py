from fastapi import APIRouter

from app.api import auth, sleep, steps, water

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(sleep.router)
api_router.include_router(water.router)
api_router.include_router(steps.router)
