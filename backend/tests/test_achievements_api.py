H = "/api/v1"


def test_fresh_user_has_everything_locked(client, auth_headers):
    r = client.get(f"{H}/achievements", headers=auth_headers).json()
    assert r["unlocked"] == []
    assert "first_meal" in r["locked"]


def test_badges_unlock_from_logged_data(client, auth_headers):
    for d in (1, 2, 3):
        day = f"2026-10-0{d}"
        client.put(f"{H}/metrics/steps", json={"day": day, "value": 9000}, headers=auth_headers)
    client.post(
        f"{H}/meals",
        json={"day": "2026-10-01", "name": "Egg", "calories": 90},
        headers=auth_headers,
    )
    r = client.get(f"{H}/achievements", headers=auth_headers).json()
    assert set(r["unlocked"]) == {"first_meal", "steps_3"}
    assert "steps_7" in r["locked"]


def test_achievements_are_per_user(client, auth_headers):
    client.post(
        f"{H}/meals",
        json={"day": "2026-10-01", "name": "Egg", "calories": 90},
        headers=auth_headers,
    )
    client.post("/api/v1/auth/register", json={"email": "x@y.co", "password": "password123"})
    r = client.post("/api/v1/auth/login", data={"username": "x@y.co", "password": "password123"})
    other = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.get(f"{H}/achievements", headers=other).json()["unlocked"] == []
