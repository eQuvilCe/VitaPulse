from datetime import date

from app.services import body, nutrition, templates

TODAY = date(2026, 10, 31)
ANN = nutrition.Body(170, 82, 31, "female", "light")


def test_mifflin_and_activity():
    kcal = nutrition.calories(ANN, "maintain", 0)
    # 10*82 + 6.25*170 - 5*31 - 161 = 1566.5 -> 1566; * 1.375
    assert kcal["bmr"] == 1566
    assert kcal["tdee"] == 2153
    assert kcal["target_calories"] == 2150
    assert kcal["daily_delta"] == -3


def test_default_loss_pace_is_half_a_kilo():
    nutr, fc = nutrition.build(ANN, "lose", 6, TODAY)
    assert nutr["daily_delta"] == -553
    assert fc["weekly_change_kg"] == -0.5
    assert fc["weeks"] == 12.0
    assert fc["eta_date"] == "2027-01-23"
    assert fc["target_weight_kg"] == 76
    assert fc["pace"] == "safe"


def test_far_target_date_slows_the_pace():
    _, fc = nutrition.build(ANN, "lose", 6, TODAY, date(2027, 3, 1))
    assert fc["pace"] == "safe"
    assert fc["eta_date"] <= "2027-03-01"
    assert -0.5 < fc["weekly_change_kg"] < 0


def test_unrealistic_date_is_capped_at_one_percent():
    nutr, fc = nutrition.build(ANN, "lose", 6, TODAY, date(2026, 12, 1))
    assert fc["pace"] == "capped"
    assert fc["weekly_change_kg"] >= -0.82
    assert fc["eta_date"] > "2026-12-01"
    assert nutr["target_calories"] >= nutrition.CALORIE_FLOOR["female"]


def test_calorie_floor():
    small = nutrition.Body(150, 50, 60, "female", "sedentary")
    nutr, fc = nutrition.build(small, "lose", 5, TODAY, date(2026, 12, 1))
    assert nutr["target_calories"] == 1200
    assert fc["pace"] == "capped"


def test_gain_adds_a_surplus():
    b = nutrition.Body(180, 65, 25, "male", "moderate")
    nutr, fc = nutrition.build(b, "gain", 5, TODAY)
    assert nutr["daily_delta"] > 0
    assert fc["weekly_change_kg"] == 0.25
    assert fc["target_weight_kg"] == 70


def test_macros_add_up_to_the_target():
    nutr, _ = nutrition.build(ANN, "lose", 6, TODAY)
    kcal = nutr["protein_g"] * 4 + nutr["fat_g"] * 9 + nutr["carbs_g"] * 4
    assert abs(kcal - nutr["target_calories"]) <= 10
    assert nutr["protein_g"] >= 1.6 * 70


def test_maintain_has_no_eta():
    nutr, fc = nutrition.build(ANN, "maintain", 5, TODAY)
    assert nutr["daily_delta"] == 0 or abs(nutr["daily_delta"]) < 10
    assert fc["eta_date"] is None and fc["target_weight_kg"] == 82


def test_healthy_range():
    assert body.healthy_range(170) == (53.5, 72.2)
    assert body.to_healthy(82, 170) == -9.8
    assert body.to_healthy(60, 170) == 0
    assert body.to_healthy(50, 170) == 3.5


def test_menu_hits_calories_and_respects_vegan():
    menu = templates.build_menu(1700, ["vegan"], 4, "en")
    assert len(menu) == 7
    assert all(len(d["meals"]) == 4 for d in menu)
    assert all(abs(d["totals"]["calories"] - 1700) <= 60 for d in menu)
    vegan_ids = {
        r["name"]["en"]
        for r in templates.RECIPES
        if not r["tags"] & {"meat", "fish", "dairy", "egg"}
    }
    assert all(m["name"] in vegan_ids for d in menu for m in d["meals"])


def test_every_slot_has_an_option_under_strict_restrictions():
    strict = ["vegan", "gluten_free", "nut_free", "lactose_free"]
    options = templates.allowed_recipes(strict)
    assert all(options[t] for t in ("breakfast", "lunch", "dinner", "snack"))


def test_shopping_list_sums_the_week():
    menu = templates.build_menu(1800, [], 3, "ru")
    items = templates.shopping_list(menu)
    assert items and all(i["amount"] > 0 for i in items)
    assert {i["category"] for i in items} <= {"produce", "protein", "dairy", "grains", "pantry"}


def test_workouts_follow_goal_and_location():
    gym = templates.build_workouts("gain", "gym", "active", "en")
    assert gym["type"] == "strength" and gym["days_per_week"] == 5
    home = templates.build_workouts("lose", "home", "light", "ru")
    assert home["type"] == "fat_loss" and [d["day"] for d in home["days"]] == [1, 3, 5]
    assert "на каждую ногу" in home["days"][0]["exercises"][2]["reps"]
