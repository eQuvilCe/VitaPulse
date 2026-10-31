from datetime import date, timedelta

from tests.conftest import PLAN_INPUT

JPEG = b"\xff\xd8\xff\xe0" + b"\0" * 100


def test_measurement_upsert(client, auth_headers):
    r = client.put(
        "/api/v1/progress/measurements",
        json={"day": "2026-10-01", "waist_cm": 80},
        headers=auth_headers,
    )
    assert r.status_code == 200
    r = client.put(
        "/api/v1/progress/measurements",
        json={"day": "2026-10-01", "hips_cm": 100},
        headers=auth_headers,
    )
    assert (r.json()["waist_cm"], r.json()["hips_cm"]) == (80, 100)
    rows = client.get("/api/v1/progress/measurements", headers=auth_headers).json()
    assert len(rows) == 1
    url = f"/api/v1/progress/measurements/{rows[0]['id']}"
    assert client.delete(url, headers=auth_headers).status_code == 204


def test_measurement_needs_a_value(client, auth_headers):
    r = client.put(
        "/api/v1/progress/measurements", json={"day": "2026-10-01"}, headers=auth_headers
    )
    assert r.status_code == 422


def _other_user(client):
    client.post("/api/v1/auth/register", json={"email": "o@b.co", "password": "password123"})
    r = client.post("/api/v1/auth/login", data={"username": "o@b.co", "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_photos_are_private(client, auth_headers):
    r = client.post(
        "/api/v1/progress/photos",
        files={"image": ("a.jpg", JPEG, "image/jpeg")},
        data={"kind": "before", "day": "2026-10-01"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    photo = r.json()
    assert photo["kind"] == "before" and photo["content_type"] == "image/jpeg"

    file = client.get(photo["url"], headers=auth_headers)
    assert file.status_code == 200 and file.content == JPEG
    assert "no-store" in file.headers["cache-control"]

    other = _other_user(client)
    assert client.get(photo["url"], headers=other).status_code == 404
    assert client.get(photo["url"]).status_code == 401
    assert client.get("/api/v1/progress/photos", headers=other).json() == []
    assert client.delete(f"/api/v1/progress/photos/{photo['id']}", headers=other).status_code == 404

    assert (
        client.delete(f"/api/v1/progress/photos/{photo['id']}", headers=auth_headers).status_code
        == 204
    )
    assert client.get(photo["url"], headers=auth_headers).status_code == 404


def test_photo_rejects_gif(client, auth_headers):
    r = client.post(
        "/api/v1/progress/photos",
        files={"image": ("a.gif", b"GIF89a" + b"\0" * 10, "image/gif")},
        headers=auth_headers,
    )
    assert r.status_code == 415


def test_workouts_and_summary(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    r = client.post(
        "/api/v1/progress/workouts",
        json={"title": "Circuit", "kind": "fat_loss", "duration_min": 40, "plan_day": 1},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["workout"]["day"] == date.today().isoformat()
    later = (date.today() + timedelta(days=1)).isoformat()
    client.put("/api/v1/metrics/weight_kg", json={"day": later, "value": 79}, headers=auth_headers)
    s = client.get("/api/v1/progress/summary", headers=auth_headers).json()
    assert s["start_weight_kg"] == 82 and s["current_weight_kg"] == 79
    assert s["change_kg"] == -3 and s["target_weight_kg"] == 76
    assert s["goal_progress_percent"] == 50
    assert s["workouts_total"] == 1
    wid = r.json()["workout"]["id"]
    assert (
        client.delete(f"/api/v1/progress/workouts/{wid}", headers=auth_headers).status_code == 204
    )
