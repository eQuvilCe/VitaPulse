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


def _log_weight(client, headers, value):
    client.put(
        "/api/v1/metrics/weight_kg",
        json={"day": "2026-10-02", "value": value},
        headers=headers,
    )


def test_body_stats_without_profile(client, auth_headers):
    r = client.get("/api/v1/stats/body", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["bmi"] is None


def test_body_stats_bmi_only_without_age_and_sex(client, auth_headers):
    _log_weight(client, auth_headers, 80)
    client.patch("/api/v1/auth/me", json={"height_cm": 180}, headers=auth_headers)
    body = client.get("/api/v1/stats/body", headers=auth_headers).json()
    assert body["bmi"] == 24.7
    assert body["bmi_category"] == "normal"
    assert body["daily_calories"] is None


def test_body_stats_full_profile(client, auth_headers):
    _log_weight(client, auth_headers, 80)
    client.patch(
        "/api/v1/auth/me",
        json={"height_cm": 180, "birth_year": 1990, "sex": "male", "activity": "sedentary"},
        headers=auth_headers,
    )
    body = client.get("/api/v1/stats/body", headers=auth_headers).json()
    assert body["bmr"] > 1500
    assert body["daily_calories"] == round(body["bmr"] * 1.2)
