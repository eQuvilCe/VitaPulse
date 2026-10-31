"""Deterministic menu and workout builder used when the AI is off or fails.

Recipes are stored at one base portion and scaled to each meal's calorie share.
Every text comes in en and ru.
"""

import math
from collections import defaultdict

# id: (en, ru, unit, shopping category)
INGREDIENTS: dict[str, tuple[str, str, str, str]] = {
    "oats": ("Rolled oats", "Овсяные хлопья", "g", "grains"),
    "milk": ("Milk 1.5%", "Молоко 1,5%", "ml", "dairy"),
    "plant_milk": ("Soy milk", "Соевое молоко", "ml", "dairy"),
    "berries": ("Berries (fresh or frozen)", "Ягоды (свежие или замороженные)", "g", "produce"),
    "honey": ("Honey", "Мёд", "g", "pantry"),
    "eggs": ("Eggs", "Яйца", "pcs", "protein"),
    "spinach": ("Spinach", "Шпинат", "g", "produce"),
    "tomato": ("Tomatoes", "Помидоры", "pcs", "produce"),
    "bread": ("Whole-grain bread", "Цельнозерновой хлеб", "g", "grains"),
    "olive_oil": ("Olive oil", "Оливковое масло", "ml", "pantry"),
    "greek_yogurt": ("Greek yogurt 2%", "Греческий йогурт 2%", "g", "dairy"),
    "granola": ("Granola, no added sugar", "Гранола без сахара", "g", "grains"),
    "banana": ("Bananas", "Бананы", "pcs", "produce"),
    "walnuts": ("Walnuts", "Грецкие орехи", "g", "pantry"),
    "tofu": ("Firm tofu", "Тофу твёрдый", "g", "protein"),
    "bell_pepper": ("Bell peppers", "Болгарский перец", "pcs", "produce"),
    "avocado": ("Avocado", "Авокадо", "pcs", "produce"),
    "chia": ("Chia seeds", "Семена чиа", "g", "pantry"),
    "cottage_cheese": ("Cottage cheese 5%", "Творог 5%", "g", "dairy"),
    "flour": ("Whole-wheat flour", "Цельнозерновая мука", "g", "grains"),
    "sour_cream": ("Sour cream 10%", "Сметана 10%", "g", "dairy"),
    "chicken": ("Chicken breast", "Куриная грудка", "g", "protein"),
    "rice": ("Brown rice", "Бурый рис", "g", "grains"),
    "broccoli": ("Broccoli", "Брокколи", "g", "produce"),
    "beef": ("Lean beef", "Постная говядина", "g", "protein"),
    "buckwheat": ("Buckwheat", "Гречка", "g", "grains"),
    "cucumber": ("Cucumbers", "Огурцы", "pcs", "produce"),
    "lentils": ("Red lentils", "Красная чечевица", "g", "grains"),
    "carrot": ("Carrots", "Морковь", "pcs", "produce"),
    "onion": ("Onions", "Лук", "pcs", "produce"),
    "tomato_paste": ("Tomato paste", "Томатная паста", "g", "pantry"),
    "salmon": ("Salmon fillet", "Филе лосося", "g", "protein"),
    "quinoa": ("Quinoa", "Киноа", "g", "grains"),
    "salad_mix": ("Salad leaves", "Салатный микс", "g", "produce"),
    "lemon": ("Lemons", "Лимоны", "pcs", "produce"),
    "chickpeas": ("Canned chickpeas", "Нут консервированный", "g", "pantry"),
    "turkey": ("Turkey breast", "Филе индейки", "g", "protein"),
    "tortilla": ("Whole-wheat tortillas", "Цельнозерновые лепёшки", "pcs", "grains"),
    "cod": ("Cod fillet", "Филе трески", "g", "protein"),
    "zucchini": ("Zucchini", "Кабачки", "pcs", "produce"),
    "potatoes": ("Potatoes", "Картофель", "g", "produce"),
    "mixed_veg": ("Stir-fry vegetable mix", "Овощная смесь для жарки", "g", "produce"),
    "soy_sauce": ("Soy sauce", "Соевый соус", "ml", "pantry"),
    "rice_noodles": ("Rice noodles", "Рисовая лапша", "g", "grains"),
    "coconut_milk": ("Light coconut milk", "Кокосовое молоко лайт", "ml", "pantry"),
    "curry_paste": ("Curry paste", "Паста карри", "g", "pantry"),
    "turkey_mince": ("Ground turkey", "Фарш индейки", "g", "protein"),
    "tomato_sauce": ("Tomato passata", "Томатная паста-пюре (пассата)", "g", "pantry"),
    "pasta": ("Whole-grain pasta", "Цельнозерновые макароны", "g", "grains"),
    "herbs": ("Fresh herbs", "Зелень", "g", "produce"),
    "beans": ("Canned red beans", "Красная фасоль консервированная", "g", "pantry"),
    "apple": ("Apples", "Яблоки", "pcs", "produce"),
    "peanut_butter": ("Peanut butter", "Арахисовая паста", "g", "pantry"),
    "kefir": ("Kefir 1%", "Кефир 1%", "ml", "dairy"),
    "hummus": ("Hummus", "Хумус", "g", "pantry"),
}

# What a recipe contains, used to apply restrictions.
EXCLUDES: dict[str, set[str]] = {
    "vegetarian": {"meat", "fish"},
    "vegan": {"meat", "fish", "dairy", "egg"},
    "pescatarian": {"meat"},
    "lactose_free": {"dairy"},
    "gluten_free": {"gluten"},
    "nut_free": {"nuts"},
    "no_pork": {"pork"},
    "halal": {"pork"},
}
# Soft preferences: applied only while enough recipes remain.
PREFER_WITHOUT: dict[str, set[str]] = {"low_carb": {"high_carb"}}
KNOWN_RESTRICTIONS = sorted(set(EXCLUDES) | set(PREFER_WITHOUT))


def _r(rid, meal_type, tags, kcal, p, f, c, minutes, ingredients, name, steps):
    return {
        "id": rid,
        "type": meal_type,
        "tags": set(tags),
        "calories": kcal,
        "protein_g": p,
        "fat_g": f,
        "carbs_g": c,
        "time_min": minutes,
        "ingredients": ingredients,
        "name": name,
        "steps": steps,
    }


RECIPES = [
    # --- breakfast
    _r(
        "oatmeal_berries",
        "breakfast",
        ["dairy", "gluten", "high_carb"],
        420,
        17,
        9,
        68,
        10,
        {"oats": 60, "milk": 200, "berries": 100, "honey": 10},
        {"en": "Oatmeal with berries", "ru": "Овсянка с ягодами"},
        {
            "en": [
                "Bring the milk to a simmer and stir in the oats.",
                "Cook for 4–5 minutes, stirring.",
                "Top with berries and honey.",
            ],
            "ru": [
                "Доведите молоко почти до кипения и всыпьте хлопья.",
                "Варите 4–5 минут, помешивая.",
                "Добавьте ягоды и мёд.",
            ],
        },
    ),
    _r(
        "veggie_omelette",
        "breakfast",
        ["egg", "gluten"],
        400,
        24,
        22,
        24,
        12,
        {"eggs": 3, "spinach": 50, "tomato": 1, "bread": 40, "olive_oil": 5},
        {"en": "Spinach and tomato omelette", "ru": "Омлет со шпинатом и помидором"},
        {
            "en": [
                "Whisk the eggs with a pinch of salt.",
                "Wilt the spinach and diced tomato in the oil for 2 minutes.",
                "Pour in the eggs, cover and cook 4 minutes. Serve with the bread.",
            ],
            "ru": [
                "Взбейте яйца со щепоткой соли.",
                "Обжарьте шпинат и нарезанный помидор на масле 2 минуты.",
                "Залейте яйцами, накройте и готовьте 4 минуты. Подавайте с хлебом.",
            ],
        },
    ),
    _r(
        "yogurt_bowl",
        "breakfast",
        ["dairy", "gluten", "nuts", "high_carb"],
        450,
        25,
        14,
        56,
        5,
        {"greek_yogurt": 200, "granola": 40, "banana": 1, "walnuts": 15},
        {"en": "Greek yogurt bowl", "ru": "Боул с греческим йогуртом"},
        {
            "en": [
                "Spoon the yogurt into a bowl.",
                "Top with sliced banana, granola and chopped walnuts.",
            ],
            "ru": [
                "Выложите йогурт в миску.",
                "Сверху — нарезанный банан, гранола и рубленые орехи.",
            ],
        },
    ),
    _r(
        "tofu_scramble",
        "breakfast",
        [],
        380,
        22,
        25,
        14,
        15,
        {"tofu": 150, "bell_pepper": 1, "spinach": 50, "olive_oil": 10, "avocado": 0.5},
        {"en": "Tofu scramble with peppers", "ru": "Скрэмбл из тофу с перцем"},
        {
            "en": [
                "Crumble the tofu with a fork.",
                "Fry the diced pepper in the oil for 3 minutes, add tofu, turmeric and salt.",
                "Stir in the spinach until wilted. Serve with sliced avocado.",
            ],
            "ru": [
                "Разомните тофу вилкой.",
                "Обжарьте нарезанный перец на масле 3 минуты, добавьте тофу, куркуму и соль.",
                "Вмешайте шпинат, пока он не опадёт. Подавайте с авокадо.",
            ],
        },
    ),
    _r(
        "chia_pudding",
        "breakfast",
        [],
        360,
        12,
        13,
        48,
        5,
        {"chia": 30, "plant_milk": 200, "berries": 100, "banana": 0.5},
        {"en": "Chia pudding with berries", "ru": "Чиа-пудинг с ягодами"},
        {
            "en": [
                "Mix the chia seeds with the soy milk and leave overnight in the fridge.",
                "In the morning top with berries and banana.",
            ],
            "ru": [
                "Смешайте чиа с соевым молоком и оставьте на ночь в холодильнике.",
                "Утром добавьте ягоды и банан.",
            ],
        },
    ),
    _r(
        "syrniki",
        "breakfast",
        ["dairy", "egg", "gluten"],
        430,
        33,
        14,
        40,
        20,
        {"cottage_cheese": 200, "eggs": 1, "flour": 30, "sour_cream": 30, "berries": 50},
        {"en": "Cottage cheese pancakes", "ru": "Сырники"},
        {
            "en": [
                "Mash the cottage cheese with the egg and flour.",
                "Shape 5–6 small patties and brown them in a non-stick pan, 3 minutes a side.",
                "Serve with sour cream and berries.",
            ],
            "ru": [
                "Разомните творог с яйцом и мукой.",
                "Сформируйте 5–6 сырников и обжарьте на сковороде с антипригарным покрытием "
                "по 3 минуты с каждой стороны.",
                "Подавайте со сметаной и ягодами.",
            ],
        },
    ),
    # --- lunch
    _r(
        "chicken_rice_bowl",
        "lunch",
        ["meat", "high_carb"],
        560,
        50,
        14,
        60,
        30,
        {"chicken": 150, "rice": 70, "broccoli": 150, "olive_oil": 10},
        {"en": "Chicken, rice and broccoli bowl", "ru": "Боул с курицей, рисом и брокколи"},
        {
            "en": [
                "Cook the rice according to the pack.",
                "Season the chicken and pan-fry in half the oil, 5–6 minutes a side.",
                "Steam the broccoli for 5 minutes, slice the chicken and assemble the bowl.",
            ],
            "ru": [
                "Отварите рис по инструкции на упаковке.",
                "Посолите курицу и обжарьте на половине масла по 5–6 минут с каждой стороны.",
                "Приготовьте брокколи на пару 5 минут, нарежьте курицу и соберите боул.",
            ],
        },
    ),
    _r(
        "buckwheat_beef",
        "lunch",
        ["meat", "high_carb"],
        580,
        42,
        20,
        55,
        35,
        {"beef": 130, "buckwheat": 70, "cucumber": 1, "tomato": 1, "olive_oil": 10},
        {"en": "Beef with buckwheat and fresh salad", "ru": "Говядина с гречкой и свежим салатом"},
        {
            "en": [
                "Boil the buckwheat in salted water for 15 minutes.",
                "Cut the beef into strips and sear in half the oil for 6–8 minutes.",
                "Dice cucumber and tomato, dress with the rest of the oil.",
            ],
            "ru": [
                "Отварите гречку в подсоленной воде 15 минут.",
                "Нарежьте говядину полосками и обжарьте на половине масла 6–8 минут.",
                "Нарежьте огурец и помидор, заправьте оставшимся маслом.",
            ],
        },
    ),
    _r(
        "lentil_soup",
        "lunch",
        ["high_carb"],
        420,
        24,
        11,
        58,
        35,
        {"lentils": 80, "carrot": 1, "onion": 1, "tomato_paste": 20, "olive_oil": 10},
        {"en": "Red lentil soup", "ru": "Суп из красной чечевицы"},
        {
            "en": [
                "Soften the chopped onion and carrot in the oil for 5 minutes.",
                "Add the lentils, tomato paste and 600 ml water; simmer 20 minutes.",
                "Season with cumin, salt and lemon; blend if you like it smooth.",
            ],
            "ru": [
                "Обжарьте нарезанные лук и морковь на масле 5 минут.",
                "Добавьте чечевицу, томатную пасту и 600 мл воды, варите 20 минут.",
                "Приправьте зирой, солью и лимоном; при желании пробейте блендером.",
            ],
        },
    ),
    _r(
        "salmon_quinoa",
        "lunch",
        ["fish"],
        600,
        40,
        25,
        50,
        25,
        {"salmon": 140, "quinoa": 70, "salad_mix": 100, "lemon": 0.5, "olive_oil": 5},
        {"en": "Salmon with quinoa salad", "ru": "Лосось с салатом из киноа"},
        {
            "en": [
                "Rinse the quinoa and cook it in twice its volume of water for 15 minutes.",
                "Bake the salmon at 200 °C for 12–14 minutes.",
                "Toss the quinoa with salad leaves, lemon juice and oil; serve with the fish.",
            ],
            "ru": [
                "Промойте киноа и варите в двойном объёме воды 15 минут.",
                "Запекайте лосось при 200 °C 12–14 минут.",
                "Смешайте киноа с салатом, лимонным соком и маслом, подавайте с рыбой.",
            ],
        },
    ),
    _r(
        "chickpea_salad",
        "lunch",
        [],
        480,
        18,
        18,
        55,
        10,
        {
            "chickpeas": 200,
            "cucumber": 1,
            "tomato": 1,
            "bell_pepper": 1,
            "olive_oil": 15,
            "lemon": 0.5,
        },
        {"en": "Chickpea salad", "ru": "Салат с нутом"},
        {
            "en": [
                "Drain and rinse the chickpeas.",
                "Dice the vegetables and mix with the chickpeas.",
                "Dress with oil, lemon juice, salt and pepper.",
            ],
            "ru": [
                "Слейте жидкость с нута и промойте его.",
                "Нарежьте овощи кубиками и смешайте с нутом.",
                "Заправьте маслом, лимонным соком, солью и перцем.",
            ],
        },
    ),
    _r(
        "turkey_wrap",
        "lunch",
        ["meat", "gluten", "dairy"],
        480,
        42,
        12,
        45,
        15,
        {"turkey": 120, "tortilla": 1, "salad_mix": 40, "tomato": 1, "greek_yogurt": 50},
        {"en": "Turkey wrap", "ru": "Ролл с индейкой"},
        {
            "en": [
                "Grill or pan-fry the turkey for 5 minutes a side, then slice.",
                "Spread the yogurt on the tortilla, add leaves, tomato and turkey.",
                "Roll tightly and cut in half.",
            ],
            "ru": [
                "Обжарьте индейку по 5 минут с каждой стороны и нарежьте.",
                "Смажьте лепёшку йогуртом, выложите салат, помидор и индейку.",
                "Плотно сверните и разрежьте пополам.",
            ],
        },
    ),
    # --- dinner
    _r(
        "baked_cod",
        "dinner",
        ["fish"],
        450,
        38,
        11,
        45,
        35,
        {"cod": 180, "zucchini": 1, "bell_pepper": 1, "potatoes": 200, "olive_oil": 10},
        {"en": "Baked cod with vegetables", "ru": "Треска, запечённая с овощами"},
        {
            "en": [
                "Cut potatoes, zucchini and pepper into chunks, toss with oil and salt.",
                "Roast at 200 °C for 15 minutes.",
                "Add the cod on top and bake 12–15 minutes more.",
            ],
            "ru": [
                "Нарежьте картофель, кабачок и перец, перемешайте с маслом и солью.",
                "Запекайте при 200 °C 15 минут.",
                "Положите сверху треску и запекайте ещё 12–15 минут.",
            ],
        },
    ),
    _r(
        "chicken_stirfry",
        "dinner",
        ["meat", "gluten", "high_carb"],
        520,
        45,
        12,
        55,
        20,
        {"chicken": 150, "mixed_veg": 200, "soy_sauce": 15, "rice_noodles": 60, "olive_oil": 5},
        {"en": "Chicken stir-fry with noodles", "ru": "Курица с овощами и лапшой вок"},
        {
            "en": [
                "Soak the noodles in hot water for 8 minutes.",
                "Stir-fry the sliced chicken in the oil for 5 minutes, add the vegetables.",
                "Add noodles and soy sauce, toss for 2 minutes.",
            ],
            "ru": [
                "Замочите лапшу в горячей воде на 8 минут.",
                "Обжарьте нарезанную курицу на масле 5 минут, добавьте овощи.",
                "Добавьте лапшу и соевый соус, жарьте ещё 2 минуты.",
            ],
        },
    ),
    _r(
        "tofu_curry",
        "dinner",
        ["high_carb"],
        560,
        24,
        26,
        58,
        25,
        {"tofu": 150, "coconut_milk": 100, "spinach": 60, "rice": 60, "curry_paste": 15},
        {"en": "Tofu and spinach curry", "ru": "Карри с тофу и шпинатом"},
        {
            "en": [
                "Cook the rice.",
                "Fry the curry paste for 1 minute, add coconut milk and cubed tofu.",
                "Simmer 8 minutes, stir in the spinach and serve over rice.",
            ],
            "ru": [
                "Отварите рис.",
                "Прогрейте пасту карри 1 минуту, влейте кокосовое молоко, добавьте тофу.",
                "Тушите 8 минут, вмешайте шпинат и подавайте с рисом.",
            ],
        },
    ),
    _r(
        "turkey_meatballs",
        "dinner",
        ["meat", "gluten", "high_carb"],
        550,
        44,
        12,
        62,
        35,
        {"turkey_mince": 150, "tomato_sauce": 150, "pasta": 60, "onion": 0.5, "herbs": 10},
        {"en": "Turkey meatballs with pasta", "ru": "Тефтели из индейки с пастой"},
        {
            "en": [
                "Mix the mince with grated onion and herbs, roll 8 meatballs.",
                "Simmer them in the tomato sauce for 15 minutes.",
                "Cook the pasta and serve with the meatballs and sauce.",
            ],
            "ru": [
                "Смешайте фарш с тёртым луком и зеленью, скатайте 8 тефтелей.",
                "Тушите их в томатном соусе 15 минут.",
                "Отварите пасту и подавайте с тефтелями и соусом.",
            ],
        },
    ),
    _r(
        "cottage_salad",
        "dinner",
        ["dairy"],
        300,
        34,
        11,
        12,
        10,
        {"cottage_cheese": 200, "cucumber": 1, "tomato": 1, "herbs": 15, "olive_oil": 5},
        {"en": "Cottage cheese and vegetable salad", "ru": "Салат с творогом и овощами"},
        {
            "en": [
                "Dice the cucumber and tomato, chop the herbs.",
                "Mix with the cottage cheese, oil, salt and pepper.",
            ],
            "ru": [
                "Нарежьте огурец и помидор, порубите зелень.",
                "Смешайте с творогом, маслом, солью и перцем.",
            ],
        },
    ),
    _r(
        "bean_stew",
        "dinner",
        ["high_carb"],
        480,
        20,
        11,
        75,
        30,
        {
            "beans": 200,
            "tomato_sauce": 200,
            "onion": 1,
            "bell_pepper": 1,
            "olive_oil": 10,
            "rice": 50,
        },
        {"en": "Bean and pepper stew", "ru": "Рагу из фасоли с перцем"},
        {
            "en": [
                "Cook the rice.",
                "Soften the onion and pepper in the oil, add beans and passata.",
                "Simmer 15 minutes with paprika and serve with the rice.",
            ],
            "ru": [
                "Отварите рис.",
                "Обжарьте лук и перец на масле, добавьте фасоль и томатное пюре.",
                "Тушите 15 минут с паприкой и подавайте с рисом.",
            ],
        },
    ),
    # --- snacks
    _r(
        "apple_peanut",
        "snack",
        ["nuts"],
        220,
        5,
        10,
        28,
        2,
        {"apple": 1, "peanut_butter": 20},
        {"en": "Apple with peanut butter", "ru": "Яблоко с арахисовой пастой"},
        {
            "en": ["Slice the apple and dip in the peanut butter."],
            "ru": ["Нарежьте яблоко дольками и ешьте с арахисовой пастой."],
        },
    ),
    _r(
        "kefir_berries",
        "snack",
        ["dairy"],
        170,
        9,
        5,
        22,
        2,
        {"kefir": 250, "berries": 80},
        {"en": "Kefir with berries", "ru": "Кефир с ягодами"},
        {
            "en": ["Blend or simply stir the berries into the kefir."],
            "ru": ["Взбейте ягоды с кефиром блендером или просто перемешайте."],
        },
    ),
    _r(
        "hummus_veg",
        "snack",
        [],
        200,
        6,
        10,
        20,
        5,
        {"hummus": 60, "carrot": 1, "cucumber": 1},
        {"en": "Hummus with vegetable sticks", "ru": "Хумус с овощными палочками"},
        {
            "en": ["Cut the carrot and cucumber into sticks and dip into the hummus."],
            "ru": ["Нарежьте морковь и огурец брусочками и ешьте с хумусом."],
        },
    ),
    _r(
        "boiled_eggs",
        "snack",
        ["egg"],
        160,
        13,
        11,
        3,
        10,
        {"eggs": 2, "cucumber": 1},
        {"en": "Boiled eggs and cucumber", "ru": "Варёные яйца с огурцом"},
        {
            "en": ["Boil the eggs for 9 minutes, cool in cold water and peel."],
            "ru": ["Варите яйца 9 минут, остудите в холодной воде и очистите."],
        },
    ),
    _r(
        "yogurt_honey",
        "snack",
        ["dairy"],
        170,
        15,
        3,
        20,
        2,
        {"greek_yogurt": 150, "honey": 10},
        {"en": "Greek yogurt with honey", "ru": "Греческий йогурт с мёдом"},
        {"en": ["Drizzle the yogurt with honey."], "ru": ["Полейте йогурт мёдом."]},
    ),
]

# Share of the daily calories per meal slot.
MEAL_SPLITS: dict[int, list[tuple[str, float]]] = {
    3: [("breakfast", 0.30), ("lunch", 0.40), ("dinner", 0.30)],
    4: [("breakfast", 0.25), ("lunch", 0.35), ("snack", 0.10), ("dinner", 0.30)],
    5: [("breakfast", 0.25), ("snack", 0.10), ("lunch", 0.30), ("snack", 0.10), ("dinner", 0.25)],
}


def _lang(language: str) -> str:
    return "ru" if language == "ru" else "en"


def allowed_recipes(restrictions: list[str]) -> dict[str, list[dict]]:
    """Recipes per meal type that respect the restrictions, in a stable order."""
    banned: set[str] = set()
    soft: set[str] = set()
    for r in restrictions:
        banned |= EXCLUDES.get(r, set())
        soft |= PREFER_WITHOUT.get(r, set())
    by_type: dict[str, list[dict]] = defaultdict(list)
    for recipe in RECIPES:
        if not recipe["tags"] & banned:
            by_type[recipe["type"]].append(recipe)
    for meal_type, options in by_type.items():
        preferred = [r for r in options if not r["tags"] & soft]
        if len(preferred) >= 2:
            by_type[meal_type] = preferred
    return by_type


def _scale_amount(amount: float, unit: str, factor: float) -> float:
    value = amount * factor
    if unit == "pcs":
        return max(0.5, round(value * 2) / 2)
    return max(5, int(round(value / 5) * 5))


def _portion(recipe: dict, kcal: float, lang: str) -> dict:
    factor = min(2.0, max(0.5, kcal / recipe["calories"]))
    ingredients = []
    for ing_id, amount in recipe["ingredients"].items():
        en, ru, unit, _ = INGREDIENTS[ing_id]
        ingredients.append(
            {
                "id": ing_id,
                "name": ru if lang == "ru" else en,
                "amount": _scale_amount(amount, unit, factor),
                "unit": unit,
            }
        )
    return {
        "type": recipe["type"],
        "name": recipe["name"][lang],
        "calories": round(recipe["calories"] * factor),
        "protein_g": round(recipe["protein_g"] * factor),
        "fat_g": round(recipe["fat_g"] * factor),
        "carbs_g": round(recipe["carbs_g"] * factor),
        "time_min": recipe["time_min"],
        "ingredients": ingredients,
        "steps": recipe["steps"][lang],
    }


def day_totals(meals: list[dict]) -> dict:
    return {k: sum(m[k] for m in meals) for k in ("calories", "protein_g", "fat_g", "carbs_g")}


def build_menu(
    target_kcal: int, restrictions: list[str], meals_per_day: int, language: str
) -> list[dict]:
    lang = _lang(language)
    options = allowed_recipes(restrictions)
    split = MEAL_SPLITS[meals_per_day]
    days = []
    for day in range(7):
        meals = []
        seen_types: dict[str, int] = defaultdict(int)
        for meal_type, share in split:
            pool = options.get(meal_type) or [r for r in RECIPES if r["type"] == meal_type]
            # A second snack on the same day picks a different recipe.
            idx = (day + seen_types[meal_type] * 3) % len(pool)
            seen_types[meal_type] += 1
            meals.append(_portion(pool[idx], target_kcal * share, lang))
        days.append({"day": day + 1, "meals": meals, "totals": day_totals(meals)})
    return days


def shopping_list(menu: list[dict]) -> list[dict]:
    """Sum the template menu's ingredients for the week (needs ingredient ids)."""
    totals: dict[str, float] = defaultdict(float)
    names: dict[str, str] = {}
    for day in menu:
        for meal in day["meals"]:
            for ing in meal["ingredients"]:
                totals[ing["id"]] += ing["amount"]
                names[ing["id"]] = ing["name"]
    items = []
    for ing_id, amount in totals.items():
        _, _, unit, category = INGREDIENTS[ing_id]
        amount = math.ceil(amount) if unit == "pcs" else int(math.ceil(amount / 10) * 10)
        items.append({"name": names[ing_id], "amount": amount, "unit": unit, "category": category})
    order = ["produce", "protein", "dairy", "grains", "pantry", "other"]
    return sorted(items, key=lambda i: (order.index(i["category"]), i["name"]))


def strip_ids(menu: list[dict]) -> list[dict]:
    for day in menu:
        for meal in day["meals"]:
            for ing in meal["ingredients"]:
                ing.pop("id", None)
    return menu


# --- workouts


def _ex(en, ru, sets, reps, rest, notes_en="", notes_ru=""):
    return {
        "name": {"en": en, "ru": ru},
        "sets": sets,
        "reps": reps,
        "rest_sec": rest,
        "notes": {"en": notes_en, "ru": notes_ru},
    }


WORKOUT_DAYS = {
    ("fat_loss", "home"): [
        (
            {"en": "Full-body circuit", "ru": "Круговая на всё тело"},
            "full_body",
            40,
            [
                _ex("Bodyweight squats", "Приседания", 3, "15", 45),
                _ex("Push-ups (knees if needed)", "Отжимания (можно с колен)", 3, "8-12", 45),
                _ex("Reverse lunges", "Выпады назад", 3, "10 each leg", 45),
                _ex("Glute bridge", "Ягодичный мост", 3, "15", 45),
                _ex("Plank", "Планка", 3, "30-45 s", 45),
                _ex("Jumping jacks", "Прыжки «звёздочка»", 3, "45 s", 30),
            ],
        ),
        (
            {"en": "Cardio intervals", "ru": "Кардио-интервалы"},
            "cardio",
            30,
            [
                _ex(
                    "Brisk walk or jog warm-up",
                    "Разминка: быстрая ходьба или лёгкий бег",
                    1,
                    "5 min",
                    0,
                ),
                _ex("High knees", "Бег с высоким подниманием колен", 6, "30 s", 30),
                _ex("Mountain climbers", "Скалолаз", 6, "30 s", 30),
                _ex(
                    "Squat jumps (or fast squats)",
                    "Прыжки из приседа (или быстрые приседания)",
                    4,
                    "12",
                    45,
                ),
                _ex("Cool-down walk and stretch", "Заминка: ходьба и растяжка", 1, "5 min", 0),
            ],
        ),
        (
            {"en": "Core and mobility", "ru": "Кор и мобильность"},
            "core",
            30,
            [
                _ex("Dead bug", "«Мёртвый жук»", 3, "10 each side", 30),
                _ex("Side plank", "Боковая планка", 3, "20-30 s each side", 30),
                _ex("Bird dog", "«Птица-собака»", 3, "10 each side", 30),
                _ex("Superman hold", "«Супермен»", 3, "20 s", 30),
                _ex(
                    "Hip and hamstring stretch",
                    "Растяжка бёдер и задней поверхности",
                    1,
                    "5 min",
                    0,
                ),
            ],
        ),
    ],
    ("fat_loss", "gym"): [
        (
            {
                "en": "Full body on machines + incline walk",
                "ru": "Всё тело на тренажёрах + ходьба в горку",
            },
            "full_body",
            55,
            [
                _ex("Leg press", "Жим ногами", 3, "12", 60),
                _ex("Lat pulldown", "Тяга верхнего блока", 3, "12", 60),
                _ex("Chest press machine", "Жим от груди в тренажёре", 3, "12", 60),
                _ex("Seated cable row", "Тяга нижнего блока", 3, "12", 60),
                _ex("Plank", "Планка", 3, "40 s", 45),
                _ex("Incline treadmill walk", "Ходьба на дорожке с наклоном", 1, "15 min", 0),
            ],
        ),
        (
            {"en": "Intervals and core", "ru": "Интервалы и кор"},
            "cardio",
            40,
            [
                _ex(
                    "Bike or rower intervals: 30 s hard / 60 s easy",
                    "Велотренажёр или гребля: 30 с быстро / 60 с легко",
                    10,
                    "90 s",
                    0,
                ),
                _ex("Cable crunch", "Скручивания на блоке", 3, "15", 45),
                _ex("Hanging knee raises", "Подъём коленей в висе", 3, "10-12", 45),
                _ex("Pallof press", "Жим Паллофа", 3, "12 each side", 45),
            ],
        ),
        (
            {"en": "Free weights + steady cardio", "ru": "Свободные веса + ровное кардио"},
            "full_body",
            55,
            [
                _ex("Goblet squat", "Гоблет-присед", 3, "10-12", 60),
                _ex("Dumbbell bench press", "Жим гантелей лёжа", 3, "10-12", 60),
                _ex("One-arm dumbbell row", "Тяга гантели одной рукой", 3, "10 each arm", 60),
                _ex("Romanian deadlift", "Румынская тяга", 3, "10", 60),
                _ex(
                    "Elliptical or bike, steady pace",
                    "Эллипс или велотренажёр в ровном темпе",
                    1,
                    "20 min",
                    0,
                ),
            ],
        ),
    ],
    ("strength", "home"): [
        (
            {"en": "Push", "ru": "Жимовые"},
            "push",
            40,
            [
                _ex(
                    "Push-ups",
                    "Отжимания",
                    4,
                    "8-15",
                    75,
                    "Elevate feet when it gets easy",
                    "Когда станет легко — ноги на возвышение",
                ),
                _ex("Pike push-ups", "Отжимания «пайк» для плеч", 3, "8-10", 75),
                _ex("Chair dips", "Обратные отжимания от стула", 3, "10-12", 60),
                _ex("Plank shoulder taps", "Планка с касанием плеч", 3, "20", 45),
            ],
        ),
        (
            {"en": "Legs", "ru": "Ноги"},
            "legs",
            45,
            [
                _ex("Bulgarian split squats", "Болгарские выпады", 4, "8-12 each leg", 75),
                _ex("Tempo squats (3 s down)", "Медленные приседания (3 с вниз)", 3, "12", 60),
                _ex(
                    "Single-leg glute bridge", "Ягодичный мост на одной ноге", 3, "12 each leg", 60
                ),
                _ex("Calf raises", "Подъёмы на носки", 3, "20", 45),
            ],
        ),
        (
            {"en": "Pull", "ru": "Тяговые"},
            "pull",
            40,
            [
                _ex(
                    "Backpack bent-over rows",
                    "Тяга рюкзака в наклоне",
                    4,
                    "10-12",
                    75,
                    "Load the backpack with books or water bottles",
                    "Нагрузите рюкзак книгами или бутылками с водой",
                ),
                _ex(
                    "Table (inverted) rows",
                    "Тяга к столу (австралийские подтягивания)",
                    3,
                    "8-12",
                    75,
                ),
                _ex("Reverse snow angels", "Обратные «ангелы» лёжа", 3, "12", 45),
                _ex("Backpack biceps curls", "Сгибания на бицепс с рюкзаком", 3, "12", 45),
            ],
        ),
    ],
    ("strength", "gym"): [
        (
            {"en": "Push", "ru": "Жимовые"},
            "push",
            60,
            [
                _ex("Barbell bench press", "Жим штанги лёжа", 4, "6-8", 120),
                _ex("Overhead press", "Жим штанги стоя", 3, "8", 90),
                _ex("Incline dumbbell press", "Жим гантелей на наклонной", 3, "10", 90),
                _ex("Triceps pushdown", "Разгибания на трицепс на блоке", 3, "12", 60),
            ],
        ),
        (
            {"en": "Pull", "ru": "Тяговые"},
            "pull",
            60,
            [
                _ex("Deadlift", "Становая тяга", 3, "5", 150),
                _ex(
                    "Pull-ups or lat pulldown",
                    "Подтягивания или тяга верхнего блока",
                    4,
                    "6-10",
                    90,
                ),
                _ex("Barbell row", "Тяга штанги в наклоне", 3, "8", 90),
                _ex("Dumbbell curls", "Сгибания с гантелями", 3, "12", 60),
            ],
        ),
        (
            {"en": "Legs", "ru": "Ноги"},
            "legs",
            60,
            [
                _ex("Back squat", "Приседания со штангой", 4, "6-8", 150),
                _ex("Romanian deadlift", "Румынская тяга", 3, "8-10", 90),
                _ex("Leg press", "Жим ногами", 3, "12", 90),
                _ex("Lying leg curl", "Сгибания ног лёжа", 3, "12", 60),
                _ex("Standing calf raises", "Подъёмы на носки стоя", 3, "15", 45),
            ],
        ),
    ],
}

TRAINING_DAYS = {
    "sedentary": [1, 3, 5],
    "light": [1, 3, 5],
    "moderate": [1, 2, 4, 6],
    "active": [1, 2, 3, 5, 6],
}

WORKOUT_NOTES = {
    "fat_loss": {
        "en": [
            "Warm up for 5–10 minutes before every session.",
            "Aim for 8,000–10,000 steps on rest days too.",
            "Add a round or 5 minutes when a session starts to feel easy.",
        ],
        "ru": [
            "Перед каждой тренировкой разминайтесь 5–10 минут.",
            "В дни отдыха тоже проходите 8 000–10 000 шагов.",
            "Когда станет легко — добавьте круг или 5 минут.",
        ],
    },
    "strength": {
        "en": [
            "Warm up for 5–10 minutes before every session.",
            "Add weight or reps each week while keeping clean form.",
            "Sleep 7–9 hours: muscles grow during recovery.",
        ],
        "ru": [
            "Перед каждой тренировкой разминайтесь 5–10 минут.",
            "Каждую неделю добавляйте вес или повторения, сохраняя технику.",
            "Спите 7–9 часов: мышцы растут во время восстановления.",
        ],
    },
}


REPS_RU = [
    (" each leg", " на каждую ногу"),
    (" each side", " на каждую сторону"),
    (" each arm", " на каждую руку"),
    (" min", " мин"),
    (" s", " с"),
]


def _reps(text: str, lang: str) -> str:
    if lang == "ru":
        for en, ru in REPS_RU:
            text = text.replace(en, ru)
    return text


def workout_type(goal: str) -> str:
    return "strength" if goal == "gain" else "fat_loss"


def build_workouts(goal: str, location: str, activity: str, language: str) -> dict:
    lang = _lang(language)
    kind = workout_type(goal)
    templates = WORKOUT_DAYS[(kind, location)]
    days = []
    for i, day in enumerate(TRAINING_DAYS[activity]):
        title, focus, minutes, exercises = templates[i % len(templates)]
        days.append(
            {
                "day": day,
                "title": title[lang],
                "focus": focus,
                "duration_min": minutes,
                "exercises": [
                    {
                        **e,
                        "name": e["name"][lang],
                        "reps": _reps(e["reps"], lang),
                        "notes": e["notes"][lang],
                    }
                    for e in exercises
                ],
            }
        )
    return {
        "type": kind,
        "location": location,
        "days_per_week": len(days),
        "days": days,
        "notes": WORKOUT_NOTES[kind][lang],
    }
