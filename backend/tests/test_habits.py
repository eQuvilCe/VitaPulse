def _create(client, headers, name="Stretch"):
    return client.post("/api/v1/habits", json={"name": name}, headers=headers).json()["id"]


def test_checkins_build_streak(client, auth_headers):
    hid = _create(client, auth_headers)
    for d in ("2026-10-08", "2026-10-09", "2026-10-10"):
        r = client.post(f"/api/v1/habits/{hid}/checkins", json={"day": d}, headers=auth_headers)
        assert r.status_code == 204
    h = client.get("/api/v1/habits?today=2026-10-10", headers=auth_headers).json()[0]
    assert h["done_today"] is True
    assert h["current_streak"] == 3


def test_checkin_is_idempotent(client, auth_headers):
    hid = _create(client, auth_headers)
    for _ in range(2):
        client.post(
            f"/api/v1/habits/{hid}/checkins", json={"day": "2026-10-10"}, headers=auth_headers
        )
    h = client.get("/api/v1/habits?today=2026-10-10", headers=auth_headers).json()[0]
    assert h["longest_streak"] == 1


def test_undo_checkin(client, auth_headers):
    hid = _create(client, auth_headers)
    client.post(f"/api/v1/habits/{hid}/checkins", json={"day": "2026-10-10"}, headers=auth_headers)
    client.delete(f"/api/v1/habits/{hid}/checkins/2026-10-10", headers=auth_headers)
    h = client.get("/api/v1/habits?today=2026-10-10", headers=auth_headers).json()[0]
    assert h["done_today"] is False


def test_archived_habit_is_hidden(client, auth_headers):
    hid = _create(client, auth_headers)
    assert client.delete(f"/api/v1/habits/{hid}", headers=auth_headers).status_code == 204
    assert client.get("/api/v1/habits", headers=auth_headers).json() == []
