def test_steps_upsert_and_range(client, auth_headers):
    for d, n in (("2026-10-01", 4000), ("2026-10-02", 8000), ("2026-10-02", 9500)):
        r = client.put("/api/v1/steps", json={"day": d, "steps": n}, headers=auth_headers)
        assert r.status_code == 200

    r = client.get("/api/v1/steps?to=2026-10-02", headers=auth_headers)
    assert [(x["day"], x["steps"]) for x in r.json()] == [
        ("2026-10-02", 9500),
        ("2026-10-01", 4000),
    ]


def test_steps_negative_rejected(client, auth_headers):
    r = client.put("/api/v1/steps", json={"day": "2026-10-01", "steps": -1}, headers=auth_headers)
    assert r.status_code == 422


def test_steps_limit(client, auth_headers):
    for d in ("2026-10-01", "2026-10-02", "2026-10-03"):
        client.put("/api/v1/steps", json={"day": d, "steps": 1000}, headers=auth_headers)
    r = client.get("/api/v1/steps?limit=2", headers=auth_headers)
    assert len(r.json()) == 2
    assert client.get("/api/v1/steps?limit=0", headers=auth_headers).status_code == 422
