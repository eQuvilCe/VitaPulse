from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date

from app.services.streaks import longest_streak


@dataclass(frozen=True)
class Activity:
    """Days on which the user reached something, used to unlock badges."""

    sleep_goal_days: Iterable[date] = ()
    water_goal_days: Iterable[date] = ()
    steps_goal_days: Iterable[date] = ()
    habit_days: Iterable[date] = ()
    meal_days: Iterable[date] = ()


# (code, activity field, streak length needed)
BADGES: list[tuple[str, str, int]] = [
    ("first_meal", "meal_days", 1),
    ("sleep_3", "sleep_goal_days", 3),
    ("sleep_7", "sleep_goal_days", 7),
    ("water_3", "water_goal_days", 3),
    ("water_7", "water_goal_days", 7),
    ("steps_3", "steps_goal_days", 3),
    ("steps_7", "steps_goal_days", 7),
    ("habits_7", "habit_days", 7),
    ("habits_30", "habit_days", 30),
]


def unlocked_badges(activity: Activity) -> list[str]:
    """Badge codes earned so far (a badge needs N days in a row, best run counts)."""
    best = {
        field: longest_streak(getattr(activity, field))
        for field in {f for _, f, _ in BADGES}
    }
    return [code for code, field, needed in BADGES if best[field] >= needed]
