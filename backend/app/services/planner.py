"""Builds the personal plan: formulas for the numbers, AI or templates for the content."""

import json
from datetime import date

from app.schemas.plan import AIPlan, PlanInput
from app.services import ai, nutrition, templates

PLAN_SYSTEM = """You are a registered dietitian and certified personal trainer writing a \
personal weekly plan for a healthy-lifestyle app. The calorie and macro targets are already \
calculated; build the menu around them and do not change them.

Rules:
- 7 days, exactly {meals} meals per day with types from: {slots}.
- Each day's calories within ±5% of the target, macros close to the targets.
- Everyday, affordable supermarket food; simple recipes (most under 30 minutes), varied across \
the week, reusing ingredients so the shopping list stays short.
- Respect every restriction strictly (allergies and diets are not optional).
- Ingredient amounts per one serving, units only g, ml, pcs, tbsp, tsp. 2–5 short steps.
- shopping_list: the whole week's ingredients summed, grouped by category.
- Workouts: {wtype} training, {location}, {days} sessions per week on days {day_list} (1 = \
Monday). Safe for a beginner-intermediate, with sets, reps (as text such as "10-12" or \
"30 s"), rest in seconds and short form notes. Home workouts need no equipment beyond a \
chair, a backpack or a mat.
- workout_notes: 3 short practical tips.
- Write every text in {language}."""


def _language(code: str) -> str:
    return "Russian" if code == "ru" else "English"


def ai_content(data: PlanInput, nutr: dict, lang: str) -> dict:
    slots = [s for s, _ in templates.MEAL_SPLITS[data.meals_per_day]]
    day_list = templates.TRAINING_DAYS[data.activity]
    wtype = templates.workout_type(data.goal)
    system = PLAN_SYSTEM.format(
        meals=data.meals_per_day,
        slots=", ".join(slots),
        wtype="fat-loss (circuits, intervals, steady cardio)"
        if wtype == "fat_loss"
        else "strength / muscle-gain (progressive overload)",
        location="at home" if data.location == "home" else "in a gym",
        days=len(day_list),
        day_list=", ".join(map(str, day_list)),
        language=_language(lang),
    )
    brief = {
        "sex": data.sex,
        "age": data.age,
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "goal": data.goal,
        "goal_kg": data.goal_kg,
        "activity": data.activity,
        "restrictions": data.restrictions or ["none"],
        "daily_targets": {k: nutr[k] for k in ("target_calories", "protein_g", "fat_g", "carbs_g")},
    }
    plan = ai.structured(
        AIPlan,
        system,
        "Build the plan for this person:\n" + json.dumps(brief, ensure_ascii=False),
        max_tokens=32000,
        effort="low",
        timeout=600,
        stream=True,
    )
    if len(plan.menu) != 7 or any(len(d.meals) < 3 for d in plan.menu) or not plan.workout_days:
        raise ai.AIUnavailable("incomplete plan")
    menu = []
    for i, day in enumerate(plan.menu):
        meals = [m.model_dump() for m in day.meals]
        menu.append({"day": i + 1, "meals": meals, "totals": templates.day_totals(meals)})
    days = [d.model_dump() for d in plan.workout_days]
    return {
        "menu": menu,
        "shopping_list": [s.model_dump() for s in plan.shopping_list],
        "workouts": {
            "type": wtype,
            "location": data.location,
            "days_per_week": len(days),
            "days": days,
            "notes": plan.workout_notes,
        },
    }


def template_content(data: PlanInput, nutr: dict, lang: str) -> dict:
    menu = templates.build_menu(
        nutr["target_calories"], data.restrictions, data.meals_per_day, lang
    )
    shopping = templates.shopping_list(menu)
    return {
        "menu": templates.strip_ids(menu),
        "shopping_list": shopping,
        "workouts": templates.build_workouts(data.goal, data.location, data.activity, lang),
    }


def build(data: PlanInput, lang: str, today: date | None = None) -> tuple[str, dict]:
    """Return (source, plan data without id/input)."""
    today = today or date.today()
    b = nutrition.Body(data.height_cm, data.weight_kg, data.age, data.sex, data.activity)
    nutr, fc = nutrition.build(b, data.goal, data.goal_kg, today, data.target_date)
    try:
        content, source = ai_content(data, nutr, lang), "ai"
    except ai.AIUnavailable:
        content, source = template_content(data, nutr, lang), "template"
    return source, {"nutrition": nutr, "forecast": fc, **content}
