def test_sleep_upsert_replaces_same_day(client, auth_headers):
    body = {"day": "2026-10-01", "minutes": 420, "quality": 4}
    client.put("/api/v1/sleep", json=body, headers=auth_headers)
    client.put("/api/v1/sleep", json={**body, "minutes": 480}, headers=auth_headers)
    rows = client.get("/api/v1/sleep", headers=auth_headers).json()
    assert len(rows) == 1
    assert rows[0]["minutes"] == 480


def test_sleep_range_filter(client, auth_headers):
    for d in ("2026-10-01", "2026-10-05", "2026-10-09"):
        client.put("/api/v1/sleep", json={"day": d, "minutes": 400}, headers=auth_headers)
    r = client.get("/api/v1/sleep?start=2026-10-03&end=2026-10-08", headers=auth_headers)
    assert [x["day"] for x in r.json()] == ["2026-10-05"]


def test_sleep_validation(client, auth_headers):
    r = client.put("/api/v1/sleep", json={"day": "2026-10-01", "minutes": 0}, headers=auth_headers)
    assert r.status_code == 422


def test_sleep_delete_is_scoped_to_owner(client, auth_headers):
    body = {"day": "2026-10-01", "minutes": 400}
    r = client.put("/api/v1/sleep", json=body, headers=auth_headers)
    log_id = r.json()["id"]
    client.post("/api/v1/auth/register", json={"email": "x@y.co", "password": "password123"})
    t = client.post("/api/v1/auth/login", data={"username": "x@y.co", "password": "password123"})
    other = {"Authorization": f"Bearer {t.json()['access_token']}"}
    assert client.delete(f"/api/v1/sleep/{log_id}", headers=other).status_code == 404
    assert client.delete(f"/api/v1/sleep/{log_id}", headers=auth_headers).status_code == 204


def test_sleep_requires_auth(client):
    assert client.get("/api/v1/sleep").status_code == 401
