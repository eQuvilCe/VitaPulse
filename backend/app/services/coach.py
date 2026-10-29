from dataclasses import dataclass

# Reference targets used until per-user goals exist.
SLEEP_TARGET_MIN = 7 * 60
WATER_TARGET_ML = 2000
STEPS_TARGET = 8000


@dataclass(frozen=True)
class DaySnapshot:
    sleep_minutes: int | None = None
    water_ml: float = 0
    steps: float = 0
    habits_done: int = 0
    habits_total: int = 0


def build_tips(s: DaySnapshot) -> list[str]:
    """Return tip codes; the frontend translates them into ru/uz/en."""
    tips: list[str] = []
    if s.sleep_minutes is None:
        tips.append("log_sleep")
    elif s.sleep_minutes < SLEEP_TARGET_MIN - 60:
        tips.append("sleep_more")
    if s.water_ml < WATER_TARGET_ML / 2:
        tips.append("drink_water")
    if s.steps < STEPS_TARGET / 2:
        tips.append("walk_more")
    if s.habits_total and s.habits_done < s.habits_total:
        tips.append("finish_habits")
    return tips or ["keep_going"]
