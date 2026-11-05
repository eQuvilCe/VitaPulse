from datetime import date

from app.schemas.meal import ScanResult
from app.services import ai
from tests.conftest import PLAN_INPUT

PNG = b"\x89PNG\r\n\x1a\n" + b"\0" * 64


def _scan(client, headers, **form):
    return client.post(
        "/api/v1/scan", files={"image": ("p.png", PNG, "image/png")}, data=form, headers=headers
    )


def test_scan_without_ai_uses_the_hint(client, auth_headers):
    r = _scan(client, auth_headers, hint="плов с мясом", language="ru")
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "template" and body["dish"] == "Плов" and body["calories"] == 650
    assert body["meal"] is None
    assert body["new_achievements"] == ["first_scan"]


def test_scan_unknown_food_is_a_zero_confidence_guess(client, auth_headers):
    body = _scan(client, auth_headers).json()
    assert body["confidence"] == 0 and body["calories"] > 0


def test_scan_adds_to_diary(client, auth_headers):
    body = _scan(
        client, auth_headers, hint="salad", add_to_diary="true", day="2026-10-30", meal_type="lunch"
    ).json()
    assert body["meal"]["source"] == "scan" and body["meal"]["meal_type"] == "lunch"
    meals = client.get("/api/v1/meals?day=2026-10-30", headers=auth_headers).json()
    assert meals[0]["name"] == "Salad"


def test_scan_rejects_non_images(client, auth_headers):
    r = client.post(
        "/api/v1/scan",
        files={"image": ("x.png", b"not an image", "image/png")},
        headers=auth_headers,
    )
    assert r.status_code == 415


def test_scan_uses_ai_result(client, auth_headers, monkeypatch):
    fake = ScanResult(
        dish="Caesar salad",
        calories=480,
        protein_g=30,
        fat_g=30,
        carbs_g=20,
        portion_g=320,
        confidence=1.4,
        items=[],
    )
    monkeypatch.setattr(ai, "structured", lambda *a, **kw: fake)
    body = _scan(client, auth_headers).json()
    assert body["source"] == "ai" and body["dish"] == "Caesar salad"
    assert body["confidence"] == 1.0


def test_diary_counts_against_the_plan(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    today = date.today().isoformat()
    for kcal, protein in ((500, 30), (700, 40)):
        client.post(
            "/api/v1/meals",
            json={"day": today, "name": "x", "calories": kcal, "protein_g": protein},
            headers=auth_headers,
        )
    client.put("/api/v1/metrics/water_ml", json={"day": today, "value": 1000}, headers=auth_headers)
    d = client.get("/api/v1/diary", headers=auth_headers).json()
    assert d["targets_source"] == "plan"
    assert d["totals"]["calories"] == 1200
    assert d["remaining"]["calories"] == 400
    assert d["percent"]["calories"] == 75
    assert d["water_ml"] == 1000 and d["water_target_ml"] == 2710
    assert len(d["meals"]) == 2


def test_diary_without_plan_uses_goals(client, auth_headers):
    d = client.get("/api/v1/diary?day=2026-10-01", headers=auth_headers).json()
    assert d["targets_source"] == "goals"
    assert d["targets"]["calories"] == 2200 and d["targets"]["protein_g"] == 138
    assert d["remaining"]["calories"] == 2200
