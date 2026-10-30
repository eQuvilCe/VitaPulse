from fastapi import APIRouter

from app.api import auth, dashboard, export, goals, habits, meals, metrics, sleep, stats

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(sleep.router)
api_router.include_router(metrics.router)
api_router.include_router(meals.router)
api_router.include_router(habits.router)
api_router.include_router(goals.router)
api_router.include_router(dashboard.router)
api_router.include_router(stats.router)
api_router.include_router(export.router)
