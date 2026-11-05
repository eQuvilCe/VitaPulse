"""Calorie targets, macros and goal forecast for the personal plan.

The numbers always come from these formulas, with or without AI, so the plan is
reproducible and the AI only writes the menu and workouts around them.
"""

from dataclasses import dataclass
from datetime import date, timedelta

from app.services import body

KCAL_PER_KG = 7700
# Weekly pace in kg: (comfortable, upper limit as a share of body weight, absolute cap).
LOSS_PACE = (0.5, 0.01, 1.0)
GAIN_PACE = (0.25, 0.005, 0.5)
CALORIE_FLOOR = {"female": 1200, "male": 1500}
PROTEIN_PER_KG = {"lose": 1.8, "gain": 1.8, "maintain": 1.6}
FAT_SHARE = 0.27
MIN_FAT_PER_KG = 0.6
MIN_CARBS_G = 50


@dataclass(frozen=True)
class Body:
    height_cm: float
    weight_kg: float
    age: int
    sex: str
    activity: str


def _round_to(value: float, step: int) -> int:
    return int(round(value / step) * step)


def max_weekly_pace(goal: str, weight_kg: float) -> float:
    _, share, cap = LOSS_PACE if goal == "lose" else GAIN_PACE
    return round(min(cap, weight_kg * share), 2)


def weekly_pace(
    goal: str, goal_kg: float, weight_kg: float, today: date, target_date: date | None
) -> tuple[float, str]:
    """Unsigned kg per week to plan for, and whether it is safe, fast or capped."""
    if goal == "maintain" or goal_kg <= 0:
        return 0.0, "safe"
    comfortable = LOSS_PACE[0] if goal == "lose" else GAIN_PACE[0]
    limit = max_weekly_pace(goal, weight_kg)
    comfortable = min(comfortable, limit)
    if target_date is None or target_date <= today:
        return comfortable, "safe"
    required = goal_kg / ((target_date - today).days / 7)
    if required <= comfortable:
        return round(required, 2), "safe"
    if required <= limit:
        return round(required, 2), "fast"
    return limit, "capped"


def calories(b: Body, goal: str, pace_kg: float) -> dict:
    bmr = body.bmr(b.weight_kg, b.height_cm, b.age, b.sex)
    tdee = body.daily_calories(bmr, b.activity)
    delta = pace_kg * KCAL_PER_KG / 7
    if goal == "lose":
        delta = -delta
    elif goal == "maintain":
        delta = 0
    target = max(CALORIE_FLOOR.get(b.sex, 1200), _round_to(tdee + delta, 10))
    return {"bmr": bmr, "tdee": tdee, "target_calories": target, "daily_delta": target - tdee}


def macros(target_kcal: int, b: Body, goal: str) -> dict:
    # Protein scales with lean-ish mass: above BMI 30 use the weight at BMI 27.
    ref_weight = min(b.weight_kg, max(body.weight_for_bmi(27, b.height_cm), 40))
    protein = round(PROTEIN_PER_KG[goal] * ref_weight)
    fat = max(round(target_kcal * FAT_SHARE / 9), round(MIN_FAT_PER_KG * ref_weight))
    carbs = max(MIN_CARBS_G, round((target_kcal - protein * 4 - fat * 9) / 4))
    return {"protein_g": protein, "fat_g": fat, "carbs_g": carbs}


def water_ml(b: Body) -> int:
    extra = 500 if b.activity in ("moderate", "active") else 0
    return _round_to(b.weight_kg * 33 + extra, 10)


def forecast(
    b: Body,
    goal: str,
    goal_kg: float,
    daily_delta: int,
    pace: str,
    today: date,
    target_date: date | None,
) -> dict:
    sign = -1 if goal == "lose" else 1
    target_weight = b.weight_kg if goal == "maintain" else round(b.weight_kg + sign * goal_kg, 1)
    # The pace actually achieved by the calorie target (the floor can slow it down).
    weekly = round(daily_delta * 7 / KCAL_PER_KG, 2)
    weeks = None
    eta = None
    if goal != "maintain" and goal_kg > 0 and weekly * sign > 0:
        weeks = round(goal_kg / abs(weekly), 1)
        eta = today + timedelta(days=round(weeks * 7))
        if target_date and eta > target_date and pace != "capped":
            pace = "capped"
    return {
        "start_weight_kg": b.weight_kg,
        "target_weight_kg": target_weight,
        "weekly_change_kg": weekly,
        "weeks": weeks,
        "eta_date": eta.isoformat() if eta else None,
        "requested_date": target_date.isoformat() if target_date else None,
        "pace": pace,
        "bmi_now": body.bmi(b.weight_kg, b.height_cm),
        "bmi_target": body.bmi(target_weight, b.height_cm),
    }


def build(
    b: Body, goal: str, goal_kg: float, today: date, target_date: date | None = None
) -> tuple[dict, dict]:
    """Return (nutrition, forecast) for the plan."""
    if goal == "maintain":
        goal_kg = 0
    pace_kg, pace = weekly_pace(goal, goal_kg, b.weight_kg, today, target_date)
    kcal = calories(b, goal, pace_kg)
    nutrition = {**kcal, **macros(kcal["target_calories"], b, goal), "water_ml": water_ml(b)}
    return nutrition, forecast(b, goal, goal_kg, kcal["daily_delta"], pace, today, target_date)
