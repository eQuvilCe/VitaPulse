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
