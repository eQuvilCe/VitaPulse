def test_upsert_replaces_same_day(client, auth_headers):
    body = {"day": "2026-10-01", "minutes": 420, "quality": 4}
    assert client.put("/api/v1/sleep", json=body, headers=auth_headers).status_code == 200
    body["minutes"] = 480
    r = client.put("/api/v1/sleep", json=body, headers=auth_headers)
    assert r.json()["minutes"] == 480

    r = client.get("/api/v1/sleep", headers=auth_headers)
    assert len(r.json()) == 1


def test_list_range_and_delete(client, auth_headers):
    for d in ("2026-10-01", "2026-10-02", "2026-10-03"):
        client.put("/api/v1/sleep", json={"day": d, "minutes": 400}, headers=auth_headers)
    r = client.get("/api/v1/sleep?from=2026-10-02", headers=auth_headers)
    assert [x["day"] for x in r.json()] == ["2026-10-03", "2026-10-02"]

    assert client.delete("/api/v1/sleep/2026-10-02", headers=auth_headers).status_code == 204
    assert client.delete("/api/v1/sleep/2026-10-02", headers=auth_headers).status_code == 404


def test_validation_and_auth(client, auth_headers):
    bad = {"day": "2026-10-01", "minutes": 5000}
    assert client.put("/api/v1/sleep", json=bad, headers=auth_headers).status_code == 422
    assert client.get("/api/v1/sleep").status_code == 401
