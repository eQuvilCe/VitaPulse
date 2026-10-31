"""Achievement rules. `evaluate` is cheap enough to run after every logging event."""

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import DailyMetric, Goal, Meal, Plan, UserAchievement, Workout
from app.services import streaks, userdata

CODES = [
    "first_plan",
    "first_scan",
    "first_meal",
    "diary_7",
    "diary_30",
    "weight_1",
    "weight_5",
    "weight_10",
    "goal_reached",
    "workouts_10",
    "workouts_50",
    "water_week",
    "comeback",
]
COMEBACK_GAP_DAYS = 3


def _weight_progress(db: Session, user_id: int) -> tuple[float, float | None]:
    """(kg moved towards the goal, kg from start to target or None).

    The start is the weight in the first plan, else the first logged weight.
    """
    plan = userdata.active_plan(db, user_id)
    first_plan = db.scalar(select(Plan).where(Plan.user_id == user_id).order_by(Plan.id).limit(1))
    weights = list(
        db.scalars(
            select(DailyMetric.value)
            .where(DailyMetric.user_id == user_id, DailyMetric.kind == "weight_kg")
            .order_by(DailyMetric.day)
        )
    )
    if not weights:
        return 0.0, None
    start = first_plan.input["weight_kg"] if first_plan else weights[0]
    goal = plan.input["goal"] if plan else "lose"
    sign = 1 if goal == "gain" else -1
    moved = round((weights[-1] - start) * sign, 2)
    goal_kg = None
    if plan and goal != "maintain":
        # Distance to the active plan's target, which survives rebuilds with a new weight.
        goal_kg = round(abs(plan.data["forecast"]["target_weight_kg"] - start), 2) or None
    return max(moved, 0.0), goal_kg


def _longest_gap(days: list[date]) -> int:
    ordered = sorted(set(days))
    return max(((b - a).days - 1 for a, b in zip(ordered, ordered[1:], strict=False)), default=0)


def progress(db: Session, user_id: int) -> dict[str, tuple[float, float]]:
    """Current value and target for every achievement code."""
    meal_days = list(db.scalars(select(Meal.day).where(Meal.user_id == user_id).distinct()))
    scans = db.scalar(select(func.count()).where(Meal.user_id == user_id, Meal.source == "scan"))
    plans = db.scalar(select(func.count()).where(Plan.user_id == user_id))
    workout_days = list(db.scalars(select(Workout.day).where(Workout.user_id == user_id)))
    goal = db.scalar(select(Goal).where(Goal.user_id == user_id))
    water_goal = goal.water_ml if goal else 2000
    water_days = list(
        db.scalars(
            select(DailyMetric.day).where(
                DailyMetric.user_id == user_id,
                DailyMetric.kind == "water_ml",
                DailyMetric.value >= water_goal,
            )
        )
    )
    weight_days = list(
        db.scalars(
            select(DailyMetric.day).where(
                DailyMetric.user_id == user_id, DailyMetric.kind == "weight_kg"
            )
        )
    )
    moved, goal_kg = _weight_progress(db, user_id)
    diary_best = streaks.longest_streak(meal_days)
    activity = meal_days + workout_days + weight_days
    comeback = len(set(activity)) > 1 and _longest_gap(activity) >= COMEBACK_GAP_DAYS
    return {
        "first_plan": (min(plans, 1), 1),
        "first_scan": (min(scans, 1), 1),
        "first_meal": (min(len(meal_days), 1), 1),
        "diary_7": (min(diary_best, 7), 7),
        "diary_30": (min(diary_best, 30), 30),
        "weight_1": (min(moved, 1), 1),
        "weight_5": (min(moved, 5), 5),
        "weight_10": (min(moved, 10), 10),
        "goal_reached": (min(moved, goal_kg), goal_kg) if goal_kg else (0, 1),
        "workouts_10": (min(len(workout_days), 10), 10),
        "workouts_50": (min(len(workout_days), 50), 50),
        "water_week": (min(streaks.longest_streak(water_days), 7), 7),
        "comeback": (1 if comeback else 0, 1),
    }


def evaluate(db: Session, user_id: int, extra: tuple[str, ...] = ()) -> list[str]:
    """Grant every achievement whose target is met, plus `extra` codes for events that
    leave no rows behind (a scan that is not saved); return the newly granted codes."""
    have = set(db.scalars(select(UserAchievement.code).where(UserAchievement.user_id == user_id)))
    met = [code for code, (value, target) in progress(db, user_id).items() if value >= target]
    new = [code for code in dict.fromkeys([*extra, *met]) if code not in have]
    for code in new:
        db.add(UserAchievement(user_id=user_id, code=code))
    if new:
        try:
            db.commit()
        except IntegrityError:
            # A parallel request granted the same code first.
            db.rollback()
            return []
    return new


def streak_summary(db: Session, user_id: int, today: date | None = None) -> dict:
    today = today or date.today()
    meal_days = list(db.scalars(select(Meal.day).where(Meal.user_id == user_id).distinct()))
    goal = db.scalar(select(Goal).where(Goal.user_id == user_id))
    water_days = db.scalars(
        select(DailyMetric.day).where(
            DailyMetric.user_id == user_id,
            DailyMetric.kind == "water_ml",
            DailyMetric.value >= (goal.water_ml if goal else 2000),
            DailyMetric.day >= today - timedelta(days=400),
        )
    )
    return {
        "diary_current": streaks.current_streak(meal_days, today),
        "diary_longest": streaks.longest_streak(meal_days),
        "workouts_total": db.scalar(select(func.count()).where(Workout.user_id == user_id)),
        "water_current": streaks.current_streak(water_days, today),
    }
