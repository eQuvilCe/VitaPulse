def test_add_and_summarize(client, auth_headers):
    for ml in (250, 500):
        r = client.post("/api/v1/water", json={"amount_ml": ml}, headers=auth_headers)
        assert r.status_code == 201
    assert len(client.get("/api/v1/water", headers=auth_headers).json()) == 2
    r = client.get("/api/v1/water/summary", headers=auth_headers)
    assert r.json()["total_ml"] == 750


def test_rejects_bad_amount(client, auth_headers):
    r = client.post("/api/v1/water", json={"amount_ml": 0}, headers=auth_headers)
    assert r.status_code == 422


def test_delete_own_entry_only(client, auth_headers):
    log_id = client.post("/api/v1/water", json={"amount_ml": 200}, headers=auth_headers).json()["id"]
    client.post("/api/v1/auth/register", json={"email": "x@y.co", "password": "password123"})
    t = client.post("/api/v1/auth/login", data={"username": "x@y.co", "password": "password123"})
    other = {"Authorization": f"Bearer {t.json()['access_token']}"}
    assert client.delete(f"/api/v1/water/{log_id}", headers=other).status_code == 404
    assert client.delete(f"/api/v1/water/{log_id}", headers=auth_headers).status_code == 204


def test_requires_auth(client):
    assert client.get("/api/v1/water").status_code == 401
