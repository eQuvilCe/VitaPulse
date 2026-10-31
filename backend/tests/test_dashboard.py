H = "/api/v1"


def test_empty_dashboard(client, auth_headers):
    r = client.get(f"{H}/dashboard?day=2026-10-10", headers=auth_headers).json()
    assert r["sleep_minutes"] is None
    assert r["calories"] == 0
    assert r["tips"] == ["log_sleep", "drink_water", "walk_more"]


def test_dashboard_aggregates_everything(client, auth_headers):
    day = "2026-10-10"
    client.put(f"{H}/sleep", json={"day": day, "minutes": 480}, headers=auth_headers)
    client.post(f"{H}/metrics/water_ml/add", json={"day": day, "delta": 2000}, headers=auth_headers)
    client.put(f"{H}/metrics/steps", json={"day": day, "value": 9000}, headers=auth_headers)
    client.post(
        f"{H}/meals", json={"day": day, "name": "Soup", "calories": 400}, headers=auth_headers
    )
    hid = client.post(f"{H}/habits", json={"name": "Read"}, headers=auth_headers).json()["id"]
    client.post(f"{H}/habits/{hid}/checkins", json={"day": day}, headers=auth_headers)

    r = client.get(f"{H}/dashboard?day={day}", headers=auth_headers).json()
    assert r["sleep_minutes"] == 480
    assert r["water_ml"] == 2000
    assert r["calories"] == 400
    assert (r["habits_done"], r["habits_total"]) == (1, 1)
    assert r["tips"] == ["keep_going"]


def test_dashboard_uses_saved_goals(client, auth_headers):
    client.patch("/api/v1/goals", json={"water_ml": 4000}, headers=auth_headers)
    client.put(
        "/api/v1/metrics/water_ml", json={"day": "2026-10-02", "value": 1500}, headers=auth_headers
    )
    r = client.get("/api/v1/dashboard?day=2026-10-02", headers=auth_headers).json()
    assert r["goals"]["water_ml"] == 4000
    assert "drink_water" in r["tips"]


def test_dashboard_score_breakdown(client, auth_headers):
    day = "2026-10-11"
    empty = client.get(f"{H}/dashboard?day={day}", headers=auth_headers).json()["score"]
    # no habits yet, so only the habit points are handed out
    assert empty == {"total": 25, "sleep": 0, "water": 0, "steps": 0, "habits": 25}

    client.put(f"{H}/sleep", json={"day": day, "minutes": 420}, headers=auth_headers)
    client.put(f"{H}/metrics/steps", json={"day": day, "value": 4000}, headers=auth_headers)
    score = client.get(f"{H}/dashboard?day={day}", headers=auth_headers).json()["score"]
    assert score["sleep"] == 30
    assert score["steps"] == 13
    assert score["total"] == 30 + 13 + 25
