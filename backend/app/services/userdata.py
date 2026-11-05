"""Small lookups shared by the plan, diary, coach and achievements endpoints."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import DailyMetric, Goal, Meal, Plan, User


def language(user: User, requested: str | None = None) -> str:
    code = requested or user.language
    return "ru" if code == "ru" else "en"


def active_plan(db: Session, user_id: int) -> Plan | None:
    return db.scalar(
        select(Plan)
        .where(Plan.user_id == user_id, Plan.active.is_(True))
        .order_by(Plan.id.desc())
        .limit(1)
    )


def latest_weight(db: Session, user_id: int) -> float | None:
    return db.scalar(
        select(DailyMetric.value)
        .where(DailyMetric.user_id == user_id, DailyMetric.kind == "weight_kg")
        .order_by(DailyMetric.day.desc())
        .limit(1)
    )


def metric(db: Session, user_id: int, kind: str, day: date) -> float | None:
    return db.scalar(
        select(DailyMetric.value).where(
            DailyMetric.user_id == user_id, DailyMetric.kind == kind, DailyMetric.day == day
        )
    )


def day_totals(db: Session, user_id: int, day: date) -> dict:
    row = db.execute(
        select(
            func.coalesce(func.sum(Meal.calories), 0),
            func.coalesce(func.sum(Meal.protein_g), 0),
            func.coalesce(func.sum(Meal.fat_g), 0),
            func.coalesce(func.sum(Meal.carbs_g), 0),
        ).where(Meal.user_id == user_id, Meal.day == day)
    ).one()
    return {
        "calories": int(row[0]),
        "protein_g": round(row[1], 1),
        "fat_g": round(row[2], 1),
        "carbs_g": round(row[3], 1),
    }


def daily_targets(db: Session, user_id: int) -> tuple[dict, int, str]:
    """(macro targets, water target, where they came from)."""
    plan = active_plan(db, user_id)
    if plan is not None:
        n = plan.data["nutrition"]
        targets = {k: n[k] for k in ("protein_g", "fat_g", "carbs_g")}
        return {"calories": n["target_calories"], **targets}, n["water_ml"], "plan"
    goal = db.scalar(select(Goal).where(Goal.user_id == user_id))
    kcal = goal.calories if goal else 2200
    water = goal.water_ml if goal else 2000
    targets = {
        "calories": kcal,
        "protein_g": round(kcal * 0.25 / 4),
        "fat_g": round(kcal * 0.30 / 9),
        "carbs_g": round(kcal * 0.45 / 4),
    }
    return targets, water, "goals"
