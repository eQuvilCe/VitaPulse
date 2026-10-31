"""AI coach: the daily tip and the chat, each with a rule-based fallback."""

import json
import re
from datetime import date, timedelta

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import DailyMetric, Meal, User, Workout
from app.services import ai, streaks, userdata

TIP_CATEGORIES = ("nutrition", "workout", "water", "sleep", "motivation")


class Tip(BaseModel):
    title: str
    text: str
    category: str


def user_context(db: Session, user: User, today: date) -> dict:
    """A compact picture of the user's recent data for prompts and rules."""
    plan = userdata.active_plan(db, user.id)
    targets, water_target, _ = userdata.daily_targets(db, user.id)
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=6)
    week_kcal = db.execute(
        select(Meal.day, func.sum(Meal.calories))
        .where(Meal.user_id == user.id, Meal.day.between(week_ago, today))
        .group_by(Meal.day)
    ).all()
    weights = db.execute(
        select(DailyMetric.day, DailyMetric.value)
        .where(
            DailyMetric.user_id == user.id,
            DailyMetric.kind == "weight_kg",
            DailyMetric.day >= today - timedelta(days=30),
        )
        .order_by(DailyMetric.day)
    ).all()
    workout_days = list(
        db.scalars(
            select(Workout.day).where(
                Workout.user_id == user.id, Workout.day >= today - timedelta(days=13)
            )
        )
    )
    meal_days = db.scalars(select(Meal.day).where(Meal.user_id == user.id).distinct())
    return {
        "today": today.isoformat(),
        "name": user.name or None,
        "goal": plan.input["goal"] if plan else None,
        "target_weight_kg": plan.data["forecast"]["target_weight_kg"] if plan else None,
        "location": plan.input["location"] if plan else None,
        "restrictions": plan.input["restrictions"] if plan else [],
        "daily_targets": targets,
        "water_target_ml": water_target,
        "today_eaten": userdata.day_totals(db, user.id, today),
        "yesterday_eaten": userdata.day_totals(db, user.id, yesterday),
        "yesterday_water_ml": userdata.metric(db, user.id, "water_ml", yesterday) or 0,
        "days_logged_last_7": len(week_kcal),
        "avg_kcal_logged_days_7": round(sum(k for _, k in week_kcal) / len(week_kcal))
        if week_kcal
        else None,
        "weight_30d": [{"day": d.isoformat(), "kg": v} for d, v in weights[-8:]],
        "workouts_last_7": sum(1 for d in workout_days if d >= week_ago),
        "days_since_workout": (today - max(workout_days)).days if workout_days else None,
        "diary_streak": streaks.current_streak(meal_days, today),
        "has_plan": plan is not None,
    }


# --- daily tip

TIP_SYSTEM = """You are a warm, practical nutrition and fitness coach in a healthy-lifestyle \
app. Write ONE tip for today based on the user's data: specific (use their numbers), \
actionable today, encouraging, never shaming. title up to 6 words, text 1–3 sentences \
(max 300 characters). category is one of: nutrition, workout, water, sleep, motivation. \
No medical claims. Write in {language}."""

TIPS = {
    "no_plan": (
        "motivation",
        {
            "en": (
                "Start with your plan",
                "Fill in the questionnaire and get calories, a weekly "
                "menu and workouts made for you — it takes two minutes.",
            ),
            "ru": (
                "Начните с плана",
                "Заполните анкету — и получите норму калорий, меню на "
                "неделю и тренировки под вас. Это займёт пару минут.",
            ),
        },
    ),
    "over": (
        "nutrition",
        {
            "en": (
                "Lighter day today",
                "Yesterday was {over} kcal over your target. No need to "
                "starve — just pick vegetables and lean protein for dinner today.",
            ),
            "ru": (
                "Сегодня — полегче",
                "Вчера вышло на {over} ккал больше нормы. Голодать не "
                "нужно — просто сделайте ужин из овощей и нежирного белка.",
            ),
        },
    ),
    "protein": (
        "nutrition",
        {
            "en": (
                "Protein first",
                "Yesterday you got {protein} g of protein out of {target} g. "
                "Add eggs, cottage cheese, chicken or beans to each meal today.",
            ),
            "ru": (
                "Сначала белок",
                "Вчера было {protein} г белка из {target} г. Добавьте сегодня "
                "яйца, творог, курицу или бобовые в каждый приём пищи.",
            ),
        },
    ),
    "water": (
        "water",
        {
            "en": (
                "Drink up",
                "Yesterday you drank {water} ml of {target} ml. Keep a bottle in "
                "sight and have a glass before every meal.",
            ),
            "ru": (
                "Больше воды",
                "Вчера вы выпили {water} мл из {target} мл. Держите бутылку на "
                "виду и выпивайте стакан перед каждым приёмом пищи.",
            ),
        },
    ),
    "workout": (
        "workout",
        {
            "en": (
                "Time to move",
                "It has been {days} days since your last workout. Even 20 "
                "minutes from your plan today keeps the momentum.",
            ),
            "ru": (
                "Пора подвигаться",
                "С последней тренировки прошло {days} дн. Даже 20 минут "
                "из вашего плана сегодня сохранят темп.",
            ),
        },
    ),
    "streak": (
        "motivation",
        {
            "en": (
                "{streak} days in a row",
                "You've logged your meals {streak} days running. "
                "That habit is what makes results stick — keep it going!",
            ),
            "ru": (
                "{streak} дней подряд",
                "Вы ведёте дневник {streak} дн. подряд. Именно эта "
                "привычка делает результат стойким — продолжайте!",
            ),
        },
    ),
}
GENERAL_TIPS = [
    (
        "nutrition",
        {
            "en": (
                "Half a plate of veg",
                "Fill half your plate with vegetables at "
                "lunch and dinner: more volume, fewer calories.",
            ),
            "ru": (
                "Половина тарелки — овощи",
                "В обед и ужин заполняйте половину тарелки овощами: объём больше, калорий меньше.",
            ),
        },
    ),
    (
        "sleep",
        {
            "en": (
                "Sleep is part of the plan",
                "7–9 hours of sleep keeps hunger hormones in "
                "check. Try going to bed 30 minutes earlier tonight.",
            ),
            "ru": (
                "Сон — часть плана",
                "7–9 часов сна держат гормоны голода в норме. "
                "Попробуйте сегодня лечь на 30 минут раньше.",
            ),
        },
    ),
    (
        "workout",
        {
            "en": (
                "Walk after meals",
                "A 10-minute walk after a meal helps your blood sugar and adds 1,000+ steps.",
            ),
            "ru": (
                "Прогулка после еды",
                "10 минут ходьбы после еды помогают уровню сахара и добавляют больше 1 000 шагов.",
            ),
        },
    ),
    (
        "nutrition",
        {
            "en": (
                "Plan tomorrow tonight",
                "Decide tomorrow's meals this evening — fewer spontaneous snacks.",
            ),
            "ru": (
                "Планируйте с вечера",
                "Решите с вечера, что будете есть завтра, — так меньше спонтанных перекусов.",
            ),
        },
    ),
    (
        "water",
        {
            "en": (
                "Thirst or hunger?",
                "Feeling peckish between meals? Drink a glass of water and wait 10 minutes.",
            ),
            "ru": (
                "Жажда или голод?",
                "Захотелось перекусить между едой? Выпейте стакан воды и подождите 10 минут.",
            ),
        },
    ),
    (
        "motivation",
        {
            "en": (
                "Progress, not perfection",
                "One off day doesn't undo a week. Get back to your plan with the next meal.",
            ),
            "ru": (
                "Прогресс, а не идеал",
                "Один неидеальный день не перечёркивает "
                "неделю. Вернитесь к плану со следующего приёма пищи.",
            ),
        },
    ),
    (
        "nutrition",
        {
            "en": (
                "Slow down",
                "Eat without your phone and put the fork down between "
                "bites: fullness takes about 20 minutes to register.",
            ),
            "ru": (
                "Ешьте медленнее",
                "Ешьте без телефона и откладывайте вилку между "
                "укусами: сытость приходит примерно через 20 минут.",
            ),
        },
    ),
]


def rule_tip(ctx: dict, lang: str, today: date) -> Tip:
    t = ctx["daily_targets"]
    y = ctx["yesterday_eaten"]
    key, args = None, {}
    if not ctx["has_plan"]:
        key = "no_plan"
    elif y["calories"] > t["calories"] * 1.1:
        key, args = "over", {"over": round(y["calories"] - t["calories"])}
    elif y["calories"] and y["protein_g"] < t["protein_g"] * 0.7:
        key, args = "protein", {"protein": round(y["protein_g"]), "target": t["protein_g"]}
    elif 0 < ctx["yesterday_water_ml"] < ctx["water_target_ml"] * 0.7:
        key = "water"
        args = {"water": round(ctx["yesterday_water_ml"]), "target": ctx["water_target_ml"]}
    elif ctx["days_since_workout"] is not None and ctx["days_since_workout"] >= 4:
        key, args = "workout", {"days": ctx["days_since_workout"]}
    elif ctx["diary_streak"] >= 3:
        key, args = "streak", {"streak": ctx["diary_streak"]}
    if key:
        category, texts = TIPS[key]
    else:
        category, texts = GENERAL_TIPS[today.toordinal() % len(GENERAL_TIPS)]
    title, text = texts[lang]
    return Tip(title=title.format(**args), text=text.format(**args), category=category)


def daily_tip(ctx: dict, lang: str, today: date) -> tuple[str, Tip]:
    try:
        tip = ai.structured(
            Tip,
            TIP_SYSTEM.format(language=_language(lang)),
            "User data:\n" + json.dumps(ctx, ensure_ascii=False),
            max_tokens=2000,
        )
    except ai.AIUnavailable:
        return "template", rule_tip(ctx, lang, today)
    if tip.category not in TIP_CATEGORIES:
        tip.category = "motivation"
    tip.title, tip.text = tip.title[:120], tip.text[:600]
    return "ai", tip


# --- chat

CHAT_SYSTEM = """You are Vita, the AI coach in the Vita Health app. You help with healthy \
eating, calories and macros, recipes, workouts (home and gym), weight loss and muscle gain, \
water, sleep and motivation.

- Use the user's data below to personalise answers; quote their numbers when useful.
- Be concise and practical: short paragraphs or a few bullet points, no long essays.
- Stay on topic; for unrelated requests, gently steer back to health and fitness.
- You are not a doctor. For symptoms, medical conditions, medication, pregnancy or signs of \
an eating disorder, give general safe information and recommend seeing a professional. Never \
suggest eating under 1200 kcal a day or extreme methods.
- Answer in the language of the user's last message (the app language is {language}).

User data:
{context}"""

CHAT_RULES = [
    (
        ("белок", "протеин", "protein"),
        {
            "en": "Aim for about {protein} g of protein a day, spread over every meal: eggs, "
            "cottage cheese, Greek yogurt, chicken, fish, tofu, beans and lentils.",
            "ru": "Ориентируйтесь примерно на {protein} г белка в день и распределяйте его по "
            "всем приёмам пищи: яйца, творог, греческий йогурт, курица, рыба, тофу, бобовые.",
        },
    ),
    (
        ("вод", "пить", "water", "drink"),
        {
            "en": "Your water target is about {water} ml a day. Start the morning with a glass, "
            "keep a bottle nearby and drink before each meal.",
            "ru": "Ваша норма воды — около {water} мл в день. Начинайте утро со стакана воды, "
            "держите бутылку рядом и пейте перед каждым приёмом пищи.",
        },
    ),
    (
        ("плато", "стоит", "не уход", "plateau", "stuck", "not losing"),
        {
            "en": "Plateaus are normal. Check portions honestly for a week, keep protein high, "
            "add 2,000 steps a day and give it 2–3 weeks before cutting calories further.",
            "ru": "Плато — это нормально. Неделю честно взвешивайте порции, держите белок высоким, "
            "добавьте 2 000 шагов в день и дайте телу 2–3 недели, прежде чем снижать калории.",
        },
    ),
    (
        ("трениров", "упражн", "зал", "workout", "exercise", "gym", "training"),
        {
            "en": "Follow the workouts in your plan: 3–5 sessions a week, add a little weight or "
            "a few reps each week and keep good form. Rest days with walking count too.",
            "ru": "Следуйте тренировкам из вашего плана: 3–5 занятий в неделю, понемногу "
            "добавляйте вес или повторения и следите за техникой. Дни отдыха с прогулкой "
            "тоже считаются.",
        },
    ),
    (
        ("калор", "ккал", "calor", "kcal"),
        {
            "en": "Your daily target is {kcal} kcal. Log meals in the diary or scan your plate — "
            "the counter shows what's left for the day.",
            "ru": "Ваша норма — {kcal} ккал в день. Записывайте еду в дневник или сканируйте "
            "тарелку — счётчик покажет, сколько осталось на сегодня.",
        },
    ),
    (
        ("перекус", "сладк", "snack", "sweet", "sugar"),
        {
            "en": "Good snacks: Greek yogurt, an apple with peanut butter, kefir, boiled eggs or "
            "hummus with vegetables — 150–250 kcal each. Craving sweets? Have fruit first.",
            "ru": "Хорошие перекусы: греческий йогурт, яблоко с арахисовой пастой, кефир, "
            "варёные яйца или хумус с овощами — по 150–250 ккал. Хочется сладкого? "
            "Сначала съешьте фрукт.",
        },
    ),
]
CHAT_DEFAULT = {
    "en": "I'm in offline mode right now, so here are the basics: stick to about {kcal} kcal "
    "and {protein} g of protein a day, drink around {water} ml of water, move every day "
    "and sleep 7–9 hours. Ask me about protein, water, snacks, workouts or plateaus.",
    "ru": "Сейчас я работаю в офлайн-режиме, поэтому коротко о главном: держитесь около "
    "{kcal} ккал и {protein} г белка в день, пейте около {water} мл воды, двигайтесь "
    "каждый день и спите 7–9 часов. Спросите меня про белок, воду, перекусы, "
    "тренировки или плато.",
}


def _language(lang: str) -> str:
    return "Russian" if lang == "ru" else "English"


def message_language(text: str, fallback: str) -> str:
    if re.search("[а-яё]", text, re.IGNORECASE):
        return "ru"
    if re.search("[a-z]", text, re.IGNORECASE):
        return "en"
    return fallback


def rule_reply(message: str, ctx: dict, lang: str) -> str:
    lang = message_language(message, lang)
    t = ctx["daily_targets"]
    args = {"kcal": t["calories"], "protein": t["protein_g"], "water": ctx["water_target_ml"]}
    text = message.lower()
    for keywords, replies in CHAT_RULES:
        if any(k in text for k in keywords):
            return replies[lang].format(**args)
    return CHAT_DEFAULT[lang].format(**args)


def reply(history: list[dict], message: str, ctx: dict, lang: str) -> tuple[str, str]:
    """history: earlier {role, content} turns, oldest first, without `message`."""
    system = CHAT_SYSTEM.format(
        language=_language(lang), context=json.dumps(ctx, ensure_ascii=False)
    )
    turns = [*history, {"role": "user", "content": message}]
    while turns and turns[0]["role"] != "user":
        turns.pop(0)
    try:
        return "ai", ai.chat(system, turns)
    except ai.AIUnavailable:
        return "template", rule_reply(message, ctx, lang)
