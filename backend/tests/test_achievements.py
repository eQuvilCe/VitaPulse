from datetime import date, timedelta

from tests.conftest import PLAN_INPUT


def _codes(client, headers):
    body = client.get("/api/v1/achievements", headers=headers).json()
    return {a["code"] for a in body["achievements"] if a["unlocked"]}, body


def _meal(client, headers, day):
    client.post(
        "/api/v1/meals",
        json={"day": day.isoformat(), "name": "x", "calories": 300},
        headers=headers,
    )


def test_new_user_has_nothing(client, auth_headers):
    unlocked, body = _codes(client, auth_headers)
    assert unlocked == set() and body["new"] == []
    assert len(body["achievements"]) == 13


def test_diary_streak_and_new_flag(client, auth_headers):
    today = date.today()
    for i in range(7):
        _meal(client, auth_headers, today - timedelta(days=i))
    unlocked, body = _codes(client, auth_headers)
    assert {"first_meal", "diary_7"} <= unlocked
    assert "diary_7" in body["new"]
    assert body["streaks"]["diary_current"] == 7
    diary_30 = next(a for a in body["achievements"] if a["code"] == "diary_30")
    assert (diary_30["progress"], diary_30["target"]) == (7, 30)
    # "new" is shown once
    assert _codes(client, auth_headers)[1]["new"] == []


def test_comeback_after_a_break(client, auth_headers):
    today = date.today()
    _meal(client, auth_headers, today - timedelta(days=10))
    assert "comeback" not in _codes(client, auth_headers)[0]
    _meal(client, auth_headers, today)
    assert "comeback" in _codes(client, auth_headers)[0]


def test_weight_milestones_follow_the_plan(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    unlocked, _ = _codes(client, auth_headers)
    assert "first_plan" in unlocked and "weight_1" not in unlocked
    later = (date.today() + timedelta(days=1)).isoformat()
    client.put("/api/v1/metrics/weight_kg", json={"day": later, "value": 76}, headers=auth_headers)
    unlocked, _ = _codes(client, auth_headers)
    assert {"weight_1", "weight_5", "goal_reached"} <= unlocked
    assert "weight_10" not in unlocked


def test_gain_goal_counts_upwards(client, auth_headers):
    client.post(
        "/api/v1/plan", json={**PLAN_INPUT, "goal": "gain", "goal_kg": 3}, headers=auth_headers
    )
    later = (date.today() + timedelta(days=1)).isoformat()
    client.put("/api/v1/metrics/weight_kg", json={"day": later, "value": 80}, headers=auth_headers)
    assert "weight_1" not in _codes(client, auth_headers)[0]
    client.put(
        "/api/v1/metrics/weight_kg", json={"day": later, "value": 83.5}, headers=auth_headers
    )
    assert "weight_1" in _codes(client, auth_headers)[0]


def test_ten_workouts_returned_on_the_event(client, auth_headers):
    for i in range(9):
        client.post("/api/v1/progress/workouts", json={"title": f"W{i}"}, headers=auth_headers)
    r = client.post("/api/v1/progress/workouts", json={"title": "W10"}, headers=auth_headers)
    assert r.json()["new_achievements"] == ["workouts_10"]


def test_water_week(client, auth_headers):
    today = date.today()
    for i in range(7):
        day = (today - timedelta(days=i)).isoformat()
        client.put(
            "/api/v1/metrics/water_ml", json={"day": day, "value": 2100}, headers=auth_headers
        )
    unlocked, body = _codes(client, auth_headers)
    assert "water_week" in unlocked and body["streaks"]["water_current"] == 7
