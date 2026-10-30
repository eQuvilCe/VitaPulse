ACTIVITY_FACTORS = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}


def bmi(weight_kg: float, height_cm: float) -> float:
    meters = height_cm / 100
    return round(weight_kg / (meters * meters), 1)


def bmi_category(value: float) -> str:
    if value < 18.5:
        return "underweight"
    if value < 25:
        return "normal"
    if value < 30:
        return "overweight"
    return "obese"


def bmr(weight_kg: float, height_cm: float, age: int, sex: str) -> int:
    """Mifflin-St Jeor basal metabolic rate in kcal/day."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return round(base + (5 if sex == "male" else -161))


def daily_calories(bmr_value: int, activity: str) -> int:
    return round(bmr_value * ACTIVITY_FACTORS[activity])
