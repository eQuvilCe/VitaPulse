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


HEALTHY_BMI = (18.5, 25.0)
BMI_SCALE = [
    {"category": "underweight", "min": None, "max": 18.5},
    {"category": "normal", "min": 18.5, "max": 25},
    {"category": "overweight", "min": 25, "max": 30},
    {"category": "obese", "min": 30, "max": None},
]


def weight_for_bmi(value: float, height_cm: float) -> float:
    meters = height_cm / 100
    return round(value * meters * meters, 1)


def healthy_range(height_cm: float) -> tuple[float, float]:
    """Weights in kg that keep BMI inside 18.5–25 for this height."""
    return weight_for_bmi(HEALTHY_BMI[0], height_cm), weight_for_bmi(HEALTHY_BMI[1], height_cm)


def to_healthy(weight_kg: float, height_cm: float) -> float:
    """Signed change in kg that brings the weight into the healthy range (0 if inside)."""
    low, high = healthy_range(height_cm)
    if weight_kg < low:
        return round(low - weight_kg, 1)
    if weight_kg > high:
        return round(high - weight_kg, 1)
    return 0.0
