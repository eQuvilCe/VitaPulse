from datetime import date, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.models import DailyMetric, Meal, SleepLog
from app.schemas.stats import DayStats, WeekRead

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/week", response_model=WeekRead)
def week(
    user: CurrentUser,
    db: DbSession,
    end: date | None = None,
    span: int = Query(default=7, ge=2, le=31),
) -> WeekRead:
    """Per-day values for the `span` days ending at `end`, oldest first, for charts."""
    end = end or date.today()
    start = end - timedelta(days=span - 1)

    metrics: dict[tuple[date, str], float] = {
        (day, kind): value
        for kind, day, value in db.execute(
            select(DailyMetric.kind, DailyMetric.day, DailyMetric.value).where(
                DailyMetric.user_id == user.id, DailyMetric.day.between(start, end)
            )
        )
    }
    sleep = {
        day: minutes
        for day, minutes in db.execute(
            select(SleepLog.day, SleepLog.minutes).where(
                SleepLog.user_id == user.id, SleepLog.day.between(start, end)
            )
        )
    }
    calories = {
        day: total
        for day, total in db.execute(
            select(Meal.day, func.sum(Meal.calories))
            .where(Meal.user_id == user.id, Meal.day.between(start, end))
            .group_by(Meal.day)
        )
    }

    days = []
    for offset in range(span):
        d = start + timedelta(days=offset)
        days.append(
            DayStats(
                day=d,
                sleep_minutes=sleep.get(d),
                water_ml=metrics.get((d, "water_ml"), 0),
                steps=metrics.get((d, "steps"), 0),
                weight_kg=metrics.get((d, "weight_kg")),
                mood=metrics.get((d, "mood")),
                calories=calories.get(d, 0),
            )
        )

    slept = [d.sleep_minutes for d in days if d.sleep_minutes is not None]
    return WeekRead(
        days=days,
        avg_sleep_minutes=sum(slept) / len(slept) if slept else None,
        avg_steps=sum(d.steps for d in days) / span,
    )
