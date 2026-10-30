import csv
import io
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DailyMetric, Meal, SleepLog

DAILY_COLUMNS = [
    "day",
    "sleep_minutes",
    "sleep_quality",
    "water_ml",
    "steps",
    "weight_kg",
    "mood",
    "calories",
]


def daily_rows(db: Session, user_id: int, start: date | None, end: date | None) -> list[dict]:
    """One merged row per day that has any data, oldest first."""
    rows: dict[date, dict] = {}

    def row(day: date) -> dict:
        return rows.setdefault(day, {"day": day.isoformat(), "calories": 0})

    def in_range(column):
        clauses = []
        if start:
            clauses.append(column >= start)
        if end:
            clauses.append(column <= end)
        return clauses

    for log in db.scalars(
        select(SleepLog).where(SleepLog.user_id == user_id, *in_range(SleepLog.day))
    ):
        r = row(log.day)
        r["sleep_minutes"], r["sleep_quality"] = log.minutes, log.quality
    for metric in db.scalars(
        select(DailyMetric).where(DailyMetric.user_id == user_id, *in_range(DailyMetric.day))
    ):
        row(metric.day)[metric.kind] = metric.value
    for meal in db.scalars(select(Meal).where(Meal.user_id == user_id, *in_range(Meal.day))):
        row(meal.day)["calories"] += meal.calories
    return [rows[d] for d in sorted(rows)]


def to_csv(rows: list[dict]) -> str:
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=DAILY_COLUMNS, restval="")
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()
