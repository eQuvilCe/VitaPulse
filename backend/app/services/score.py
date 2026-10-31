from dataclasses import dataclass

# Share of the 100-point daily score each area can earn.
WEIGHTS = {"sleep": 30, "water": 20, "steps": 25, "habits": 25}


@dataclass(frozen=True)
class ScoreInput:
    sleep_minutes: int | None
    sleep_goal: int
    water_ml: float
    water_goal: int
    steps: float
    steps_goal: int
    habits_done: int
    habits_total: int


def _ratio(value: float, goal: float) -> float:
    if goal <= 0:
        return 0.0
    return max(0.0, min(value / goal, 1.0))


def sleep_ratio(minutes: int | None, goal: int) -> float:
    """Full marks at the goal; oversleeping by more than two hours starts to cost points."""
    if minutes is None:
        return 0.0
    if minutes > goal + 120:
        return max(0.5, 1 - (minutes - goal - 120) / 240)
    return _ratio(minutes, goal)


def daily_score(s: ScoreInput) -> dict[str, int]:
    """Per-area points plus a `total` out of 100.

    A day with no habits defined hands out the habit points so new users
    are not penalised for something they have not set up yet.
    """
    habits = 1.0 if s.habits_total == 0 else _ratio(s.habits_done, s.habits_total)
    parts = {
        "sleep": sleep_ratio(s.sleep_minutes, s.sleep_goal),
        "water": _ratio(s.water_ml, s.water_goal),
        "steps": _ratio(s.steps, s.steps_goal),
        "habits": habits,
    }
    points = {k: int(parts[k] * WEIGHTS[k] + 0.5) for k in WEIGHTS}
    points["total"] = sum(points.values())
    return points
