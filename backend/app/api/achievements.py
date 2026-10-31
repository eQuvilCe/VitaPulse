from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.goals import get_or_create_goal
from app.models import DailyMetric, Habit, HabitCheckin, Meal, SleepLog
from app.services.achievements import BADGES, Activity, unlocked_badges

router = APIRouter(prefix="/achievements", tags=["achievements"])


class AchievementsRead(BaseModel):
    unlocked: list[str]
    locked: list[str]


def _metric_goal_days(db: DbSession, user_id: int, kind: str, goal: float) -> list:
    return list(
        db.scalars(
            select(DailyMetric.day).where(
                DailyMetric.user_id == user_id,
                DailyMetric.kind == kind,
                DailyMetric.value >= goal,
            )
        )
    )


@router.get("", response_model=AchievementsRead)
def achievements(user: CurrentUser, db: DbSession) -> AchievementsRead:
    goal = get_or_create_goal(db, user.id)
    activity = Activity(
        sleep_goal_days=db.scalars(
            select(SleepLog.day).where(
                SleepLog.user_id == user.id, SleepLog.minutes >= goal.sleep_minutes
            )
        ).all(),
        water_goal_days=_metric_goal_days(db, user.id, "water_ml", goal.water_ml),
        steps_goal_days=_metric_goal_days(db, user.id, "steps", goal.steps),
        habit_days=db.scalars(
            select(HabitCheckin.day)
            .join(Habit, Habit.id == HabitCheckin.habit_id)
            .where(Habit.user_id == user.id)
            .distinct()
        ).all(),
        meal_days=db.scalars(select(Meal.day).where(Meal.user_id == user.id).distinct()).all(),
    )
    unlocked = unlocked_badges(activity)
    return AchievementsRead(
        unlocked=unlocked, locked=[code for code, _, _ in BADGES if code not in unlocked]
    )
