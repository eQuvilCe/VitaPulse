from fastapi import APIRouter

from app.api import (
    achievements,
    auth,
    bmi,
    coach,
    cook,
    dashboard,
    exercises,
    export,
    goals,
    habits,
    meals,
    metrics,
    plan,
    progress,
    scan,
    sleep,
    stats,
)

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
api_router.include_router(plan.router)
api_router.include_router(scan.router)
api_router.include_router(bmi.router)
api_router.include_router(coach.router)
api_router.include_router(progress.router)
api_router.include_router(achievements.router)
api_router.include_router(exercises.router)
api_router.include_router(cook.router)
