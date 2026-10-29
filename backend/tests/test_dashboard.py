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
