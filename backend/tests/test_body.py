from app.services.body import bmi, bmi_category, bmr, daily_calories


def test_bmi_rounds_to_one_decimal():
    assert bmi(80, 180) == 24.7


def test_bmi_category_boundaries():
    assert bmi_category(18.4) == "underweight"
    assert bmi_category(18.5) == "normal"
    assert bmi_category(25) == "overweight"
    assert bmi_category(30) == "obese"


def test_bmr_differs_by_sex():
    male = bmr(80, 180, 30, "male")
    female = bmr(80, 180, 30, "female")
    assert male == 1780
    assert male - female == 166


def test_daily_calories_scales_with_activity():
    assert daily_calories(1780, "sedentary") == 2136
    assert daily_calories(1780, "active") > daily_calories(1780, "light")
