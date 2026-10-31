def test_week_fills_gaps_and_orders_days(client, auth_headers):
    client.put("/api/v1/sleep", json={"day": "2026-10-05", "minutes": 420}, headers=auth_headers)
    client.put(
        "/api/v1/metrics/steps", json={"day": "2026-10-07", "value": 7000}, headers=auth_headers
    )
    client.post(
        "/api/v1/meals",
        json={"day": "2026-10-07", "name": "Plov", "calories": 600},
        headers=auth_headers,
    )
    r = client.get("/api/v1/stats/week?end=2026-10-07&span=7", headers=auth_headers).json()
    assert [d["day"] for d in r["days"]][0] == "2026-10-01"
    assert r["days"][-1]["day"] == "2026-10-07"
    assert r["days"][4]["sleep_minutes"] == 420
    assert r["days"][0]["sleep_minutes"] is None
    assert r["days"][-1]["calories"] == 600
    assert r["avg_sleep_minutes"] == 420
    assert r["avg_steps"] == 1000


def test_week_rejects_bad_span(client, auth_headers):
    assert client.get("/api/v1/stats/week?span=1", headers=auth_headers).status_code == 422


def test_week_is_per_user(client, auth_headers):
    client.put("/api/v1/sleep", json={"day": "2026-10-05", "minutes": 420}, headers=auth_headers)
    client.post("/api/v1/auth/register", json={"email": "x@y.co", "password": "password123"})
    r = client.post("/api/v1/auth/login", data={"username": "x@y.co", "password": "password123"})
    other = {"Authorization": f"Bearer {r.json()['access_token']}"}
    body = client.get("/api/v1/stats/week?end=2026-10-07", headers=other).json()
    assert body["avg_sleep_minutes"] is None


def test_weight_trend_change_and_order(client, auth_headers):
    for day, kg in [("2026-10-10", 81.5), ("2026-10-02", 83.0), ("2026-10-06", 82.2)]:
        body = {"day": day, "value": kg}
        client.put("/api/v1/metrics/weight_kg", json=body, headers=auth_headers)
    r = client.get("/api/v1/stats/weight?end=2026-10-10&span=30", headers=auth_headers).json()
    assert [p["day"] for p in r["points"]] == ["2026-10-02", "2026-10-06", "2026-10-10"]
    assert r["latest_kg"] == 81.5
    assert r["change_kg"] == -1.5


def test_weight_trend_empty_and_single(client, auth_headers):
    empty = client.get("/api/v1/stats/weight?end=2026-10-10", headers=auth_headers).json()
    assert empty == {"points": [], "latest_kg": None, "change_kg": None}

    client.put(
        "/api/v1/metrics/weight_kg", json={"day": "2026-10-09", "value": 80}, headers=auth_headers
    )
    one = client.get("/api/v1/stats/weight?end=2026-10-10", headers=auth_headers).json()
    assert one["latest_kg"] == 80
    assert one["change_kg"] is None


def test_weight_trend_ignores_days_outside_window(client, auth_headers):
    client.put(
        "/api/v1/metrics/weight_kg", json={"day": "2026-08-01", "value": 90}, headers=auth_headers
    )
    r = client.get("/api/v1/stats/weight?end=2026-10-10&span=7", headers=auth_headers).json()
    assert r["points"] == []


def test_report_summarises_the_window(client, auth_headers):
    h = auth_headers
    client.put("/api/v1/sleep", json={"day": "2026-10-05", "minutes": 450}, headers=h)
    client.put("/api/v1/metrics/steps", json={"day": "2026-10-06", "value": 9000}, headers=h)
    client.put("/api/v1/metrics/steps", json={"day": "2026-10-07", "value": 11000}, headers=h)
    client.post(
        "/api/v1/meals",
        json={"day": "2026-10-07", "name": "Plov", "calories": 700},
        headers=h,
    )
    r = client.get("/api/v1/stats/report?end=2026-10-07&span=7", headers=h).json()
    assert r["start"] == "2026-10-01"
    assert r["days_logged"] == 3
    assert r["goal_hits"] == {"sleep": 1, "water": 0, "steps": 2}
    assert r["best_steps_day"] == "2026-10-07"
    assert r["avg_calories"] == 100


def test_report_empty_window(client, auth_headers):
    r = client.get("/api/v1/stats/report?end=2026-10-07", headers=auth_headers).json()
    assert r["days_logged"] == 0
    assert r["best_steps_day"] is None
    assert r["avg_sleep_minutes"] is None


def test_report_counts_weight_only_days(client, auth_headers):
    client.put(
        "/api/v1/metrics/weight_kg",
        json={"day": "2026-10-06", "value": 70.5},
        headers=auth_headers,
    )
    r = client.get("/api/v1/stats/report?end=2026-10-07", headers=auth_headers).json()
    assert r["days_logged"] == 1
