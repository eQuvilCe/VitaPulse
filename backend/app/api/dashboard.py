from datetime import date

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.api.goals import get_or_create_goal
from app.models import DailyMetric, Habit, HabitCheckin, Meal, SleepLog
from app.schemas.dashboard import DashboardRead, ScoreRead
from app.schemas.goal import GoalRead
from app.services.coach import DaySnapshot, build_tips
from app.services.score import ScoreInput, daily_score

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardRead)
def dashboard(user: CurrentUser, db: DbSession, day: date | None = None) -> DashboardRead:
    day = day or date.today()
    metrics = {
        kind: value
        for kind, value in db.execute(
            select(DailyMetric.kind, DailyMetric.value).where(
                DailyMetric.user_id == user.id, DailyMetric.day == day
            )
        )
    }
    sleep = db.scalar(
        select(SleepLog.minutes).where(SleepLog.user_id == user.id, SleepLog.day == day)
    )
    calories = db.scalar(
        select(func.coalesce(func.sum(Meal.calories), 0)).where(
            Meal.user_id == user.id, Meal.day == day
        )
    )
    habit_ids = list(
        db.scalars(select(Habit.id).where(Habit.user_id == user.id, Habit.archived.is_(False)))
    )
    done = 0
    if habit_ids:
        done = db.scalar(
            select(func.count()).where(
                HabitCheckin.habit_id.in_(habit_ids), HabitCheckin.day == day
            )
        )
    goal = get_or_create_goal(db, user.id)
    snapshot = DaySnapshot(
        sleep_minutes=sleep,
        water_ml=metrics.get("water_ml", 0),
        steps=metrics.get("steps", 0),
        habits_done=done,
        habits_total=len(habit_ids),
        sleep_goal=goal.sleep_minutes,
        water_goal=goal.water_ml,
        steps_goal=goal.steps,
    )
    score = daily_score(
        ScoreInput(
            sleep_minutes=sleep,
            sleep_goal=goal.sleep_minutes,
            water_ml=snapshot.water_ml,
            water_goal=goal.water_ml,
            steps=snapshot.steps,
            steps_goal=goal.steps,
            habits_done=done,
            habits_total=len(habit_ids),
        )
    )
    return DashboardRead(
        day=day,
        sleep_minutes=sleep,
        water_ml=snapshot.water_ml,
        steps=snapshot.steps,
        weight_kg=metrics.get("weight_kg"),
        mood=metrics.get("mood"),
        calories=calories,
        habits_done=done,
        habits_total=len(habit_ids),
        goals=GoalRead.model_validate(goal),
        score=ScoreRead(**score),
        tips=build_tips(snapshot),
    )
