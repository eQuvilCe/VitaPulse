def test_water_totals_per_day(client, auth_headers):
    for ml in (250, 300):
        r = client.post("/api/v1/water", json={"day": "2026-10-05", "ml": ml}, headers=auth_headers)
        assert r.status_code == 201
    client.post("/api/v1/water", json={"day": "2026-10-06", "ml": 500}, headers=auth_headers)

    r = client.get("/api/v1/water/2026-10-05", headers=auth_headers)
    assert r.json()["total_ml"] == 550
    assert len(r.json()["entries"]) == 2


def test_delete_only_own_entry(client, auth_headers):
    r = client.post("/api/v1/water", json={"day": "2026-10-05", "ml": 200}, headers=auth_headers)
    entry_id = r.json()["id"]

    client.post("/api/v1/auth/register", json={"email": "x@y.co", "password": "password123"})
    t = client.post("/api/v1/auth/login", data={"username": "x@y.co", "password": "password123"})
    other = {"Authorization": f"Bearer {t.json()['access_token']}"}

    assert client.delete(f"/api/v1/water/entries/{entry_id}", headers=other).status_code == 404
    assert client.delete(f"/api/v1/water/entries/{entry_id}", headers=auth_headers).status_code == 204


def test_rejects_zero_ml(client, auth_headers):
    r = client.post("/api/v1/water", json={"day": "2026-10-05", "ml": 0}, headers=auth_headers)
    assert r.status_code == 422
