from datetime import date, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.models import DailyMetric, Meal, SleepLog
from app.schemas.stats import BodyStats, DayStats, WeekRead, WeightPoint, WeightTrend
from app.services import body

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


@router.get("/weight", response_model=WeightTrend)
def weight_trend(
    user: CurrentUser,
    db: DbSession,
    end: date | None = None,
    span: int = Query(default=30, ge=2, le=365),
) -> WeightTrend:
    """Logged weights in the window, oldest first, plus the change from first to last."""
    end = end or date.today()
    start = end - timedelta(days=span - 1)
    rows = db.execute(
        select(DailyMetric.day, DailyMetric.value)
        .where(
            DailyMetric.user_id == user.id,
            DailyMetric.kind == "weight_kg",
            DailyMetric.day.between(start, end),
        )
        .order_by(DailyMetric.day)
    ).all()
    points = [WeightPoint(day=day, weight_kg=value) for day, value in rows]
    return WeightTrend(
        points=points,
        latest_kg=points[-1].weight_kg if points else None,
        change_kg=round(points[-1].weight_kg - points[0].weight_kg, 2) if len(points) > 1 else None,
    )


@router.get("/body", response_model=BodyStats)
def body_stats(user: CurrentUser, db: DbSession) -> BodyStats:
    """BMI and calorie needs from the latest logged weight and the profile."""
    weight = db.scalar(
        select(DailyMetric.value)
        .where(DailyMetric.user_id == user.id, DailyMetric.kind == "weight_kg")
        .order_by(DailyMetric.day.desc())
        .limit(1)
    )
    result = BodyStats(weight_kg=weight, bmi=None, bmi_category=None, bmr=None, daily_calories=None)
    if weight is None or user.height_cm is None:
        return result
    result.bmi = body.bmi(weight, user.height_cm)
    result.bmi_category = body.bmi_category(result.bmi)
    if user.birth_year and user.sex:
        age = date.today().year - user.birth_year
        result.bmr = int(body.bmr(weight, user.height_cm, age, user.sex))
        result.daily_calories = body.daily_calories(result.bmr, user.activity)
    return result
