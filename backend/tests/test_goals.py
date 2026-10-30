def test_defaults_created_on_first_read(client, auth_headers):
    r = client.get("/api/v1/goals", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == {"sleep_minutes": 420, "water_ml": 2000, "steps": 8000, "calories": 2200}


def test_patch_changes_only_given_fields(client, auth_headers):
    r = client.patch("/api/v1/goals", json={"steps": 12000}, headers=auth_headers)
    assert r.json()["steps"] == 12000
    assert r.json()["water_ml"] == 2000
    assert client.get("/api/v1/goals", headers=auth_headers).json()["steps"] == 12000


def test_rejects_out_of_range(client, auth_headers):
    r = client.patch("/api/v1/goals", json={"water_ml": 50}, headers=auth_headers)
    assert r.status_code == 422


def test_requires_auth(client):
    assert client.get("/api/v1/goals").status_code == 401
