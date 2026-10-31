from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class DayRow:
    day: date
    sleep_minutes: int | None
    water_ml: float
    steps: float


@dataclass(frozen=True)
class Goals:
    sleep: int
    water: int
    steps: int


def goal_hits(rows: list[DayRow], goals: Goals) -> dict[str, int]:
    """How many of the given days reached each goal."""
    return {
        "sleep": sum(
            1 for r in rows if r.sleep_minutes is not None and r.sleep_minutes >= goals.sleep
        ),
        "water": sum(1 for r in rows if r.water_ml >= goals.water),
        "steps": sum(1 for r in rows if r.steps >= goals.steps),
    }


def best_steps_day(rows: list[DayRow]) -> date | None:
    """Day with the most steps; None when nothing was walked at all."""
    top = max(rows, key=lambda r: r.steps, default=None)
    return top.day if top is not None and top.steps > 0 else None
