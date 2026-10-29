from fastapi import APIRouter

from app.api import auth, habits, meals, metrics, sleep

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(sleep.router)
api_router.include_router(metrics.router)
api_router.include_router(meals.router)
api_router.include_router(habits.router)
