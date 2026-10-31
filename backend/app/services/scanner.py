"""Photo of a plate -> dish, calories and macros."""

import base64

from app.schemas.meal import ScanResult
from app.services import ai

SCAN_SYSTEM = """You estimate nutrition from food photos for a calorie-tracking app.
Identify the dish and every visible component, estimate portion weights from visual cues \
(plate size, cutlery, hands) and give calories, protein, fat and carbs for the whole plate.
Be realistic, not optimistic: account for cooking oil and sauces.
confidence is 0..1 for how sure you are about the dish and portion. If the image shows no \
food, return dish "No food detected", zeros everywhere and confidence 0.
Write dish and item names in {language}."""

# keywords (en/ru stems) -> (en name, ru name, kcal, protein, fat, carbs, grams) per portion
FOODS = [
    (("salad", "салат"), "Salad", "Салат", 250, 8, 18, 14, 250),
    (("plov", "pilaf", "плов"), "Plov", "Плов", 650, 22, 28, 75, 350),
    (("pizza", "пицц"), "Pizza, 3 slices", "Пицца, 3 куска", 700, 30, 26, 85, 300),
    (("burger", "бургер"), "Burger", "Бургер", 650, 30, 33, 55, 250),
    (("sushi", "roll", "суши", "ролл"), "Sushi rolls", "Роллы", 450, 18, 10, 70, 250),
    (("pasta", "spaghetti", "паст", "макарон", "спагет"), "Pasta", "Паста", 550, 20, 16, 80, 350),
    (("soup", "суп", "борщ"), "Soup", "Суп", 250, 12, 9, 28, 350),
    (("oat", "porridge", "овсян", "каш"), "Porridge", "Каша", 300, 10, 7, 50, 250),
    (("omelet", "egg", "омлет", "яйц", "яичниц"), "Eggs", "Яйца", 300, 20, 22, 4, 180),
    (("steak", "beef", "стейк", "говядин"), "Steak", "Стейк", 550, 50, 38, 0, 250),
    (("salmon", "fish", "лосос", "рыб"), "Fish", "Рыба", 400, 38, 24, 4, 200),
    (
        ("chicken", "куриц", "курин"),
        "Chicken with a side",
        "Курица с гарниром",
        550,
        45,
        16,
        50,
        350,
    ),
    (("rice", "рис"), "Rice", "Рис", 300, 6, 3, 62, 250),
    (("buckwheat", "греч"), "Buckwheat", "Гречка", 300, 11, 6, 52, 250),
    (("potato", "fries", "картоф", "пюре", "фри"), "Potatoes", "Картофель", 350, 6, 15, 48, 250),
    (
        ("sandwich", "toast", "бутерброд", "сэндвич", "тост"),
        "Sandwich",
        "Бутерброд",
        400,
        18,
        16,
        45,
        200,
    ),
    (("pancake", "блин", "сырник"), "Pancakes", "Блины", 400, 14, 14, 55, 200),
    (("yogurt", "йогурт", "творог"), "Yogurt", "Йогурт", 180, 14, 5, 20, 200),
    (("cake", "dessert", "торт", "десерт", "пирожн"), "Dessert", "Десерт", 400, 5, 20, 50, 120),
    (
        ("fruit", "apple", "banana", "фрукт", "яблок", "банан"),
        "Fruit",
        "Фрукты",
        100,
        1,
        0,
        25,
        180,
    ),
]
GENERIC = ("Mixed plate", "Блюдо", 500, 25, 20, 55, 350)


def estimate_from_hint(hint: str | None, language: str) -> ScanResult:
    text = (hint or "").lower()
    for keywords, *food in FOODS:
        if any(k in text for k in keywords):
            match, confidence = food, 0.3
            break
    else:
        match, confidence = GENERIC, 0.0
    en, ru, kcal, p, f, c, grams = match
    name = ru if language == "ru" else en
    if hint and confidence == 0.0:
        name = hint.strip()[:120]
    return ScanResult(
        dish=name,
        calories=kcal,
        protein_g=p,
        fat_g=f,
        carbs_g=c,
        portion_g=grams,
        confidence=confidence,
        items=[],
    )


def scan(image: bytes, media_type: str, hint: str | None, language: str) -> tuple[str, ScanResult]:
    """Return (source, result)."""
    try:
        prompt = "Estimate the nutrition of this meal."
        if hint:
            prompt += f" The user says it is: {hint[:200]}"
        result = ai.structured(
            ScanResult,
            SCAN_SYSTEM.format(language="Russian" if language == "ru" else "English"),
            [
                ai.image_block(base64.standard_b64encode(image).decode(), media_type),
                {"type": "text", "text": prompt},
            ],
            max_tokens=4000,
        )
    except ai.AIUnavailable:
        return "template", estimate_from_hint(hint, language)
    result.confidence = min(1.0, max(0.0, result.confidence))
    result.dish = result.dish[:120] or "Meal"
    for field in ("calories", "portion_g"):
        setattr(result, field, max(0, getattr(result, field)))
    return "ai", result
