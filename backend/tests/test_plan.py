from datetime import date, timedelta

from app.schemas.plan import AIPlan
from app.services import ai
from tests.conftest import PLAN_INPUT


def test_preview_is_public_and_complete(client):
    r = client.post("/api/v1/plan/preview", json={**PLAN_INPUT, "language": "ru"})
    assert r.status_code == 200
    plan = r.json()
    assert plan["id"] is None and plan["source"] == "template" and plan["language"] == "ru"
    assert plan["nutrition"]["target_calories"] == 1600
    assert len(plan["menu"]) == 7 and len(plan["menu"][0]["meals"]) == 4
    assert plan["shopping_list"]
    assert plan["workouts"]["type"] == "fat_loss" and plan["workouts"]["location"] == "home"


def test_create_saves_and_syncs_profile(client, auth_headers):
    r = client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    assert r.status_code == 201
    plan_id = r.json()["id"]

    assert client.get("/api/v1/plan", headers=auth_headers).json()["id"] == plan_id
    me = client.get("/api/v1/auth/me", headers=auth_headers).json()
    assert me["height_cm"] == 170 and me["sex"] == "female"
    assert me["birth_year"] == date.today().year - 31
    goals = client.get("/api/v1/goals", headers=auth_headers).json()
    assert goals["calories"] == 1600
    weights = client.get("/api/v1/metrics/weight_kg", headers=auth_headers).json()
    assert weights[0]["value"] == 82


def test_no_plan_is_404(client, auth_headers):
    assert client.get("/api/v1/plan", headers=auth_headers).status_code == 404
    assert client.post("/api/v1/plan/rebuild", json={}, headers=auth_headers).status_code == 404


def test_rebuild_keeps_target_weight(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    r = client.post("/api/v1/plan/rebuild", json={"weight_kg": 79}, headers=auth_headers)
    assert r.status_code == 201
    plan = r.json()
    assert plan["input"]["goal_kg"] == 3
    assert plan["forecast"]["target_weight_kg"] == 76
    history = client.get("/api/v1/plan/history", headers=auth_headers).json()
    assert [h["id"] for h in history] == [plan["id"], plan["id"] - 1]


def test_rebuild_uses_latest_logged_weight(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    later = (date.today() + timedelta(days=1)).isoformat()
    client.put("/api/v1/metrics/weight_kg", json={"day": later, "value": 80}, headers=auth_headers)
    plan = client.post("/api/v1/plan/rebuild", json={}, headers=auth_headers).json()
    assert plan["input"]["weight_kg"] == 80


def test_rejects_past_target_date(client):
    body = {**PLAN_INPUT, "target_date": "2020-01-01"}
    assert client.post("/api/v1/plan/preview", json=body).status_code == 422


def test_ai_content_is_used_when_available(client, monkeypatch):
    meal = {
        "type": "breakfast",
        "name": "AI oats",
        "calories": 400,
        "protein_g": 30,
        "fat_g": 10,
        "carbs_g": 50,
        "time_min": 5,
        "ingredients": [{"name": "Oats", "amount": 50, "unit": "g"}],
        "steps": ["Cook"],
    }
    fake = AIPlan.model_validate(
        {
            "menu": [{"day": d, "meals": [meal] * 4} for d in range(1, 8)],
            "shopping_list": [{"name": "Oats", "amount": 1400, "unit": "g", "category": "grains"}],
            "workout_days": [
                {
                    "day": 1,
                    "title": "Circuit",
                    "focus": "full_body",
                    "duration_min": 30,
                    "exercises": [{"name": "Squats", "sets": 3, "reps": "15", "rest_sec": 45}],
                }
            ],
            "workout_notes": ["Warm up"],
        }
    )
    monkeypatch.setattr(ai, "structured", lambda *a, **kw: fake)
    plan = client.post("/api/v1/plan/preview", json=PLAN_INPUT).json()
    assert plan["source"] == "ai"
    assert plan["menu"][0]["totals"]["calories"] == 1600
    assert plan["workouts"]["days_per_week"] == 1


def test_incomplete_ai_plan_falls_back(client, monkeypatch):
    monkeypatch.setattr(
        ai,
        "structured",
        lambda *a, **kw: AIPlan(menu=[], shopping_list=[], workout_days=[], workout_notes=[]),
    )
    assert client.post("/api/v1/plan/preview", json=PLAN_INPUT).json()["source"] == "template"
