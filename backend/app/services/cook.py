"""Cooking assistant: recipes from what is in the fridge, and healthier swaps.

AI first; the fallback matches the fridge list against the built-in template recipes.
"""

import hashlib
import json
import re

from app.schemas.cook import AICook, AISwaps, CookRecipe, Swap, SwapRead
from app.services import ai, templates

# Words (lower-case en, ru stems) that identify each template ingredient in a free-text list.
KEYWORDS: dict[str, tuple[str, ...]] = {
    "oats": ("oat", "овсян", "геркулес"),
    "milk": ("milk", "молок"),
    "plant_milk": ("soy milk", "plant milk", "oat milk", "соев", "растительн"),
    "berries": ("berr", "strawberr", "blueberr", "raspberr", "ягод", "клубник", "черник", "малин"),
    "honey": ("honey", "мёд", "мед"),
    "eggs": ("egg", "яйц", "яйко"),
    "spinach": ("spinach", "шпинат"),
    "tomato": ("tomato", "помидор", "томат", "черри"),
    "bread": ("bread", "toast", "хлеб", "тост"),
    "olive_oil": ("oil", "масл"),
    "greek_yogurt": ("yogurt", "yoghurt", "йогурт"),
    "granola": ("granola", "muesli", "гранол", "мюсли"),
    "banana": ("banana", "банан"),
    "walnuts": ("walnut", "nut", "орех"),
    "tofu": ("tofu", "тофу"),
    "bell_pepper": ("pepper", "перец", "перц"),
    "avocado": ("avocado", "авокадо"),
    "chia": ("chia", "чиа"),
    "cottage_cheese": ("cottage", "curd", "творог"),
    "flour": ("flour", "мука", "муки"),
    "sour_cream": ("sour cream", "сметан"),
    "chicken": ("chicken", "куриц", "курин", "курочк", "кура"),
    "rice": ("rice", "рис"),
    "broccoli": ("broccoli", "брокколи"),
    "beef": ("beef", "говядин", "говяж"),
    "buckwheat": ("buckwheat", "греч"),
    "cucumber": ("cucumber", "огур"),
    "lentils": ("lentil", "чечевиц"),
    "carrot": ("carrot", "морков"),
    "onion": ("onion", "лук"),
    "tomato_paste": ("tomato paste", "томатная паста"),
    "salmon": ("salmon", "лосос", "сёмг", "семг", "форел"),
    "quinoa": ("quinoa", "киноа"),
    "salad_mix": ("salad", "lettuce", "leaves", "салат"),
    "lemon": ("lemon", "лимон"),
    "chickpeas": ("chickpea", "нут"),
    "turkey": ("turkey", "индейк", "индюш"),
    "tortilla": ("tortilla", "wrap", "pita", "лаваш", "лепёшк", "лепешк", "тортиль"),
    "cod": ("cod", "white fish", "fish", "треск", "минтай", "хек", "рыб"),
    "zucchini": ("zucchini", "courgette", "кабач", "цукини"),
    "potatoes": ("potato", "картоф", "картош"),
    "mixed_veg": ("frozen veg", "vegetable mix", "овощная смесь", "замороженные овощи"),
    "soy_sauce": ("soy sauce", "соевый соус"),
    "rice_noodles": ("noodle", "лапш"),
    "coconut_milk": ("coconut", "кокос"),
    "curry_paste": ("curry", "карри"),
    "turkey_mince": ("mince", "ground turkey", "ground meat", "фарш"),
    "tomato_sauce": ("passata", "tomato sauce", "томатный соус", "пассат", "томатное пюре"),
    "pasta": ("pasta", "spaghetti", "macaroni", "паст", "макарон", "спагет"),
    "herbs": ("herb", "parsley", "dill", "basil", "зелен", "петрушк", "укроп", "базилик"),
    "beans": ("bean", "фасол"),
    "apple": ("apple", "яблок"),
    "peanut_butter": ("peanut", "арахис"),
    "kefir": ("kefir", "кефир"),
    "hummus": ("hummus", "хумус"),
    "tuna": ("tuna", "тунец", "тунц"),
    "mushrooms": ("mushroom", "champignon", "гриб", "шампиньон"),
}
# Kitchen basics nobody lists: always treated as available.
STAPLES = {"olive_oil"}

TIMER_RE = re.compile(
    r"(\d+)(?:\s*[–-]\s*(\d+))?\s*(minutes?|mins?|минут[аыу]?|мин|seconds?|secs?|секунд[аыу]?|сек)\b",
    re.IGNORECASE,
)


def mentions(text: str, keywords: tuple[str, ...]) -> bool:
    """True if a word in `text` starts with a keyword (so "лук" doesn't hit "клубника")."""
    text = text.lower()
    words = re.findall(r"[a-zа-яё]+", text)
    return any((k in text) if " " in k else any(w.startswith(k) for w in words) for k in keywords)


def matches(items: list[str]) -> set[str]:
    """Template ingredient ids found in a free-text fridge list."""
    return {ing_id for raw in items for ing_id, words in KEYWORDS.items() if mentions(raw, words)}


def step_timer(text: str) -> int | None:
    m = TIMER_RE.search(text)
    if not m:
        return None
    value = int(m.group(2) or m.group(1))
    unit = m.group(3).lower()
    seconds = value if unit.startswith(("s", "с")) else value * 60
    return seconds if 0 < seconds <= 6 * 3600 else None


def recipe_tags(kcal: float, protein: float, time_min: int, contains: set[str]) -> list[str]:
    tags = []
    if kcal and protein * 4 / kcal >= 0.3:
        tags.append("high_protein")
    if kcal <= 400:
        tags.append("low_calorie")
    if not contains & {"meat", "fish"}:
        tags.append("vegetarian")
        if not contains & {"dairy", "egg"}:
            tags.append("vegan")
    if time_min <= 15:
        tags.append("quick")
    return tags


DESCRIPTION = {
    "en": "{time} min · {kcal} kcal · {protein} g protein per serving",
    "ru": "{time} мин · {kcal} ккал · {protein} г белка на порцию",
}


def _template_recipe(recipe: dict, have: set[str], kcal: int, servings: int, lang: str) -> dict:
    portion = templates._portion(recipe, kcal, lang)
    ingredients, missing = [], []
    for ing in portion["ingredients"]:
        _, _, unit, _ = templates.INGREDIENTS[ing["id"]]
        owned = ing["id"] in have or ing["id"] in STAPLES
        amount = (
            templates._scale_amount(ing["amount"], unit, servings)
            if servings > 1
            else (ing["amount"])
        )
        ingredients.append({"name": ing["name"], "amount": amount, "unit": unit, "have": owned})
        if not owned:
            missing.append(ing["name"])
    steps = [{"text": s, "timer_sec": step_timer(s)} for s in portion["steps"]]
    return {
        "key": recipe["id"],
        "name": portion["name"],
        "description": DESCRIPTION[lang].format(
            time=recipe["time_min"], kcal=portion["calories"], protein=portion["protein_g"]
        ),
        "meal_type": recipe["type"],
        "time_min": recipe["time_min"],
        "servings": servings,
        "calories": portion["calories"],
        "protein_g": portion["protein_g"],
        "fat_g": portion["fat_g"],
        "carbs_g": portion["carbs_g"],
        "ingredients": ingredients,
        "missing": missing,
        "steps": steps,
        "tags": recipe_tags(
            portion["calories"], portion["protein_g"], recipe["time_min"], recipe["tags"]
        ),
    }


def _allowed(restrictions: list[str]) -> list[dict]:
    banned: set[str] = set()
    for r in restrictions:
        banned |= templates.EXCLUDES.get(r, set())
    return [r for r in templates.RECIPES if not r["tags"] & banned]


def template_suggest(
    fridge: list[str],
    kcal: int,
    time_min: int | None,
    meal_type: str | None,
    restrictions: list[str],
    servings: int,
    lang: str,
    count: int = 3,
) -> list[dict]:
    have = matches(fridge)
    pool = _allowed(restrictions)
    if meal_type:
        pool = [r for r in pool if r["type"] == meal_type] or pool
    if time_min:
        pool = [r for r in pool if r["time_min"] <= time_min] or pool

    def score(recipe: dict) -> tuple:
        needed = [i for i in recipe["ingredients"] if i not in STAPLES]
        used = sum(1 for i in needed if i in have)
        return (-used / len(needed), -used, abs(recipe["calories"] - kcal), recipe["id"])

    best = sorted(pool, key=score)[:count]
    return [_template_recipe(r, have, kcal, servings, lang) for r in best]


COOK_SYSTEM = """You are a chef and dietitian in a healthy-eating app. Suggest exactly 3 \
different healthy recipes that use as much as possible of what the user has in the fridge.

- Each recipe about {kcal} kcal per serving (±10%), balanced, high in protein and vegetables.
- {time}Home cooking with everyday ingredients; assume salt, pepper, spices, water and oil.
- Respect every restriction strictly: {restrictions}.
- ingredients: amounts for {servings} serving(s), units only g, ml, pcs, tbsp, tsp; have=true \
only for ingredients from the fridge list (and the basics above).
- calories and macros are per serving.
- steps: 3–6 clear steps; timer_sec for steps that wait (boil, bake, rest), else null.
- tags from: high_protein, low_calorie, vegetarian, vegan, quick.
- {meal}Write all text in {language}."""


TAGS = {"high_protein", "low_calorie", "vegetarian", "vegan", "quick"}


def _key(name: str) -> str:
    return "ai-" + hashlib.sha1(name.lower().encode()).hexdigest()[:10]


def ai_suggest(
    fridge: list[str],
    kcal: int,
    time_min: int | None,
    meal_type: str | None,
    restrictions: list[str],
    servings: int,
    lang: str,
) -> list[dict]:
    system = COOK_SYSTEM.format(
        kcal=kcal,
        time=f"Ready in at most {time_min} minutes. " if time_min else "",
        restrictions=", ".join(restrictions) or "none",
        servings=servings,
        meal=f"All recipes are for {meal_type}. " if meal_type else "",
        language="Russian" if lang == "ru" else "English",
    )
    result = ai.structured(
        AICook,
        system,
        "In my fridge: " + json.dumps(fridge, ensure_ascii=False),
        max_tokens=12000,
        stream=True,
        timeout=300,
    )
    if not result.recipes:
        raise ai.AIUnavailable("no recipes")
    recipes = []
    for r in result.recipes[:3]:
        data = r.model_dump()
        data["ingredients"] = [i for i in data["ingredients"] if i["name"].strip()][:40]
        data["steps"] = [
            {"text": s["text"][:600], "timer_sec": s["timer_sec"] if s["timer_sec"] else None}
            for s in data["steps"]
            if s["text"].strip()
        ][:30]
        recipes.append(
            CookRecipe(
                **{
                    **data,
                    "key": _key(r.name),
                    "name": r.name[:120],
                    "description": r.description[:400],
                    "time_min": min(600, max(1, r.time_min)),
                    "servings": servings,
                    "missing": [i["name"] for i in data["ingredients"] if not i["have"]],
                    "tags": [t for t in r.tags if t in TAGS][:10],
                }
            ).model_dump()
        )
    return recipes


def suggest(fridge, kcal, time_min, meal_type, restrictions, servings, lang) -> tuple[str, list]:
    args = (fridge, kcal, time_min, meal_type, restrictions, servings, lang)
    try:
        return "ai", ai_suggest(*args)
    except (ai.AIUnavailable, ValueError):
        return "template", template_suggest(*args)


# --- healthier swaps

# keywords -> goals it helps, en (from, to, why), ru (from, to, why), kcal saved per portion
SWAPS = [
    (
        ("sour cream", "сметан"),
        {"lower_kcal", "less_fat"},
        ("sour cream", "Greek yogurt 2%", "Same tang, a third of the calories and more protein."),
        ("сметана", "греческий йогурт 2%", "Та же кислинка, втрое меньше калорий и больше белка."),
        90,
    ),
    (
        ("mayo", "майонез"),
        {"lower_kcal", "less_fat"},
        (
            "mayonnaise",
            "Greek yogurt with mustard",
            "Creamy dressing with about 80% fewer calories.",
        ),
        (
            "майонез",
            "греческий йогурт с горчицей",
            "Сливочная заправка, калорий примерно на 80% меньше.",
        ),
        150,
    ),
    (
        ("cream", "сливк"),
        {"lower_kcal", "less_fat"},
        ("cream", "milk 1.5% + 1 tbsp cream cheese", "Keeps the sauce creamy with far less fat."),
        (
            "сливки",
            "молоко 1,5% + 1 ст. л. сливочного сыра",
            "Соус остаётся нежным, жира гораздо меньше.",
        ),
        150,
    ),
    (
        ("butter", "сливочн"),
        {"lower_kcal", "less_fat"},
        ("butter", "1 tsp olive oil", "Less fat overall and healthier fats."),
        ("сливочное масло", "1 ч. л. оливкового масла", "Меньше жира и более полезные жиры."),
        70,
    ),
    (
        ("white rice", "rice", "рис"),
        {"lower_kcal"},
        (
            "white rice",
            "half rice, half cauliflower rice",
            "Same volume on the plate, half the calories.",
        ),
        (
            "белый рис",
            "половина риса, половина цветной капусты",
            "Тот же объём на тарелке, вдвое меньше калорий.",
        ),
        100,
    ),
    (
        ("pasta", "spaghetti", "паст", "макарон", "спагет"),
        {"lower_kcal", "more_protein"},
        (
            "pasta",
            "whole-grain or lentil pasta, 60 g dry",
            "More fibre and protein, keeps you full longer.",
        ),
        (
            "макароны",
            "цельнозерновая или чечевичная паста, 60 г сухой",
            "Больше клетчатки и белка, дольше сытость.",
        ),
        80,
    ),
    (
        ("bread", "хлеб", "батон"),
        {"lower_kcal"},
        ("white bread", "whole-grain bread", "More fibre and a slower rise in blood sugar."),
        ("белый хлеб", "цельнозерновой хлеб", "Больше клетчатки и мягче скачок сахара."),
        30,
    ),
    (
        ("sugar", "сахар"),
        {"lower_kcal", "less_sugar"},
        (
            "sugar",
            "half the sugar plus cinnamon or vanilla",
            "Spices keep the sweetness you taste.",
        ),
        ("сахар", "половина сахара плюс корица или ваниль", "Специи сохраняют ощущение сладости."),
        60,
    ),
    (
        ("bacon", "бекон"),
        {"lower_kcal", "less_fat", "more_protein"},
        ("bacon", "turkey ham or chicken breast", "Smoky flavour with a fraction of the fat."),
        (
            "бекон",
            "ветчина из индейки или куриная грудка",
            "Копчёный вкус при гораздо меньшем количестве жира.",
        ),
        150,
    ),
    (
        ("sausage", "колбас", "сосиск"),
        {"lower_kcal", "less_fat", "more_protein"},
        ("sausages", "chicken breast or lean turkey", "Less fat and salt, more real protein."),
        (
            "колбаса / сосиски",
            "куриная грудка или нежирная индейка",
            "Меньше жира и соли, больше белка.",
        ),
        150,
    ),
    (
        ("pork", "свинин"),
        {"lower_kcal", "less_fat"},
        (
            "fatty pork",
            "pork tenderloin or chicken thigh without skin",
            "Far less fat per portion.",
        ),
        (
            "жирная свинина",
            "свиная вырезка или куриное бедро без кожи",
            "Гораздо меньше жира в порции.",
        ),
        120,
    ),
    (
        ("cheese", "сыр", "parmesan", "пармезан"),
        {"lower_kcal", "less_fat"},
        (
            "cheese",
            "half the amount of a strong cheese, or light mozzarella",
            "A strong flavour goes further.",
        ),
        (
            "сыр",
            "вдвое меньше выдержанного сыра или лёгкая моцарелла",
            "Яркий вкус — значит, нужно меньше.",
        ),
        80,
    ),
    (
        ("fries", "фри", "fried potato", "жарен"),
        {"lower_kcal", "less_fat"},
        (
            "deep frying",
            "oven baking or an air fryer with 1 tsp oil",
            "Crispy without soaking up oil.",
        ),
        (
            "жарка во фритюре",
            "запекание в духовке или аэрогриле с 1 ч. л. масла",
            "Хрустит, но не впитывает масло.",
        ),
        150,
    ),
    (
        ("soda", "cola", "juice", "газиров", "кола", "сок"),
        {"lower_kcal", "less_sugar"},
        ("soda or juice", "sparkling water with lemon", "Zero sugar, still refreshing."),
        ("газировка или сок", "газированная вода с лимоном", "Без сахара, но так же освежает."),
        110,
    ),
    (
        ("chocolate", "шоколад"),
        {"lower_kcal", "less_sugar"},
        ("milk chocolate", "2 squares of 85% dark chocolate", "Intense taste, much less sugar."),
        (
            "молочный шоколад",
            "2 дольки горького шоколада 85%",
            "Насыщенный вкус, сахара гораздо меньше.",
        ),
        100,
    ),
    (
        ("flour", "мука"),
        {"more_protein", "less_sugar"},
        ("white flour", "half oat or whole-wheat flour", "More fibre and protein in the dough."),
        (
            "пшеничная мука",
            "наполовину овсяная или цельнозерновая мука",
            "Больше клетчатки и белка в тесте.",
        ),
        20,
    ),
    (
        ("beef", "говяд", "mince", "фарш"),
        {"lower_kcal", "less_fat", "more_protein"},
        ("fatty mince", "lean 5% beef or turkey mince", "Same protein, half the fat."),
        ("жирный фарш", "постный говяжий 5% или фарш индейки", "Тот же белок, вдвое меньше жира."),
        120,
    ),
]

GOAL_TIPS = {
    "lower_kcal": {
        "en": [
            "Bake, grill or steam instead of frying.",
            "Fill half the plate with vegetables.",
            "Measure oil with a spoon, don't pour.",
        ],
        "ru": [
            "Запекайте, готовьте на гриле или на пару вместо жарки.",
            "Заполняйте половину тарелки овощами.",
            "Отмеряйте масло ложкой, а не наливайте на глаз.",
        ],
    },
    "more_protein": {
        "en": [
            "Add an egg, cottage cheese or beans to the dish.",
            "Use Greek yogurt in sauces and dressings.",
        ],
        "ru": [
            "Добавьте в блюдо яйцо, творог или фасоль.",
            "Используйте греческий йогурт в соусах и заправках.",
        ],
    },
    "less_sugar": {
        "en": [
            "Sweeten with fruit, cinnamon or vanilla.",
            "Check labels of sauces: ketchup and dressings hide sugar.",
        ],
        "ru": [
            "Подслащивайте фруктами, корицей или ванилью.",
            "Читайте состав соусов: в кетчупе и заправках прячется сахар.",
        ],
    },
    "less_fat": {
        "en": [
            "Choose lean cuts and remove the skin from poultry.",
            "Use a non-stick pan and a spray of oil.",
        ],
        "ru": [
            "Выбирайте нежирные части и снимайте кожу с птицы.",
            "Готовьте на антипригарной сковороде с минимумом масла.",
        ],
    },
}


def template_swaps(dish: str, ingredients: list[str], goal: str, lang: str) -> SwapRead:
    text = " ".join([dish, *ingredients])
    swaps = []
    for keywords, goals, en, ru, kcal in SWAPS:
        if goal in goals and mentions(text, keywords):
            src, dst, why = ru if lang == "ru" else en
            swaps.append(Swap(from_=src, to=dst, why=why, kcal_saved=kcal))
    return SwapRead(
        source="template",
        dish=dish,
        swaps=swaps[:6],
        tips=GOAL_TIPS[goal][lang],
        kcal_saved_total=sum(s.kcal_saved for s in swaps[:6]),
    )


SWAP_SYSTEM = """You are a dietitian in a healthy-eating app. Make the user's dish healthier \
for the goal "{goal}" while keeping it tasty and recognisable. Give 2–6 ingredient or method \
swaps (original, replacement with amount if useful, a one-sentence why, estimated kcal saved \
per portion — 0 if not about calories) and 2–3 short cooking tips. Write in {language}."""


def swaps(dish: str, ingredients: list[str], goal: str, lang: str) -> SwapRead:
    try:
        result = ai.structured(
            AISwaps,
            SWAP_SYSTEM.format(goal=goal, language="Russian" if lang == "ru" else "English"),
            json.dumps({"dish": dish, "ingredients": ingredients}, ensure_ascii=False),
            max_tokens=4000,
        )
    except ai.AIUnavailable:
        return template_swaps(dish, ingredients, goal, lang)
    items = [
        Swap(
            from_=s.original[:120],
            to=s.replacement[:200],
            why=s.why[:300],
            kcal_saved=max(0, min(2000, s.kcal_saved)),
        )
        for s in result.swaps[:6]
    ]
    if not items:
        return template_swaps(dish, ingredients, goal, lang)
    return SwapRead(
        source="ai",
        dish=dish,
        swaps=items,
        tips=[t[:300] for t in result.tips[:3]],
        kcal_saved_total=sum(s.kcal_saved for s in items),
    )
