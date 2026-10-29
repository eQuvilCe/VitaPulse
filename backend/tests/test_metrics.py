def test_water_accumulates(client, auth_headers):
    for _ in range(3):
        r = client.post(
            "/api/v1/metrics/water_ml/add",
            json={"day": "2026-10-02", "delta": 250},
            headers=auth_headers,
        )
    assert r.json()["value"] == 750


def test_set_overwrites(client, auth_headers):
    for v in (6000, 9000):
        client.put(
            "/api/v1/metrics/steps", json={"day": "2026-10-02", "value": v}, headers=auth_headers
        )
    rows = client.get("/api/v1/metrics/steps", headers=auth_headers).json()
    assert [r["value"] for r in rows] == [9000]


def test_kinds_are_separate(client, auth_headers):
    client.put("/api/v1/metrics/mood", json={"day": "2026-10-02", "value": 4}, headers=auth_headers)
    assert client.get("/api/v1/metrics/steps", headers=auth_headers).json() == []


def test_rejects_unknown_kind_and_huge_values(client, auth_headers):
    body = {"day": "2026-10-02", "value": 4}
    assert client.put("/api/v1/metrics/bogus", json=body, headers=auth_headers).status_code == 422
    big = {"day": "2026-10-02", "value": 6}
    assert client.put("/api/v1/metrics/mood", json=big, headers=auth_headers).status_code == 422
