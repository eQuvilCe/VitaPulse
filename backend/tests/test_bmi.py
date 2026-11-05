from tests.conftest import PLAN_INPUT


def test_public_calculator(client):
    r = client.get("/api/v1/bmi/calc?height_cm=170&weight_kg=82&target_weight_kg=76")
    body = r.json()
    assert body["bmi"] == 28.4 and body["category"] == "overweight"
    assert body["target_bmi"] == 26.3
    assert (body["healthy_min_kg"], body["healthy_max_kg"]) == (53.5, 72.2)
    assert body["to_healthy_kg"] == -9.8
    assert len(body["scale"]) == 4


def test_my_bmi_needs_height_and_weight(client, auth_headers):
    r = client.get("/api/v1/bmi", headers=auth_headers)
    assert r.status_code == 422 and r.json()["detail"] == "height_and_weight_required"


def test_my_bmi_uses_plan_target(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    body = client.get("/api/v1/bmi", headers=auth_headers).json()
    assert body["weight_kg"] == 82 and body["target_weight_kg"] == 76
    assert body["target_category"] == "overweight"
