def _make(client, headers, **overrides):
    body = {"kind": "water", "at": "09:30:00", **overrides}
    return client.post("/api/v1/reminders", json=body, headers=headers)


def test_requires_auth(client):
    assert client.get("/api/v1/reminders").status_code == 401


def test_create_defaults_to_every_day(client, auth_headers):
    r = _make(client, auth_headers, message="Drink a glass")
    assert r.status_code == 201
    data = r.json()
    assert data["days"] == [0, 1, 2, 3, 4, 5, 6]
    assert data["enabled"] is True
    assert data["at"] == "09:30:00"


def test_list_is_sorted_by_time(client, auth_headers):
    _make(client, auth_headers, at="21:00:00", kind="sleep")
    _make(client, auth_headers, at="08:00:00")
    times = [r["at"] for r in client.get("/api/v1/reminders", headers=auth_headers).json()]
    assert times == ["08:00:00", "21:00:00"]


def test_rejects_bad_weekday_and_kind(client, auth_headers):
    assert _make(client, auth_headers, days=[7]).status_code == 422
    assert _make(client, auth_headers, kind="coffee").status_code == 422
    assert _make(client, auth_headers, days=[]).status_code == 422


def test_days_are_deduplicated_and_sorted(client, auth_headers):
    r = _make(client, auth_headers, days=[4, 0, 4, 2])
    assert r.json()["days"] == [0, 2, 4]


def test_patch_updates_only_given_fields(client, auth_headers):
    rid = _make(client, auth_headers, message="x").json()["id"]
    r = client.patch(
        f"/api/v1/reminders/{rid}", json={"enabled": False, "days": [5, 6]}, headers=auth_headers
    )
    assert r.status_code == 200
    data = r.json()
    assert data["enabled"] is False
    assert data["days"] == [5, 6]
    assert data["message"] == "x"


def test_delete_reminder(client, auth_headers):
    rid = _make(client, auth_headers).json()["id"]
    assert client.delete(f"/api/v1/reminders/{rid}", headers=auth_headers).status_code == 204
    assert client.get("/api/v1/reminders", headers=auth_headers).json() == []
    assert client.delete(f"/api/v1/reminders/{rid}", headers=auth_headers).status_code == 404


def test_cannot_touch_other_users_reminder(client, auth_headers):
    rid = _make(client, auth_headers).json()["id"]
    client.post("/api/v1/auth/register", json={"email": "c@d.co", "password": "password123"})
    r = client.post("/api/v1/auth/login", data={"username": "c@d.co", "password": "password123"})
    other = {"Authorization": f"Bearer {r.json()['access_token']}"}
    patch = client.patch(f"/api/v1/reminders/{rid}", json={"enabled": False}, headers=other)
    assert patch.status_code == 404
    assert client.delete(f"/api/v1/reminders/{rid}", headers=other).status_code == 404
    assert client.get("/api/v1/reminders", headers=other).json() == []


def test_due_returns_only_matching_reminders(client, auth_headers):
    _make(client, auth_headers, at="09:00:00", message="now")
    _make(client, auth_headers, at="15:00:00", message="later")
    _make(client, auth_headers, at="09:01:00", enabled=False, message="off")
    r = client.get(
        "/api/v1/reminders/due", params={"now": "2026-11-02T09:02:00"}, headers=auth_headers
    )
    assert [x["message"] for x in r.json()] == ["now"]


def test_due_uses_wall_clock_and_ignores_offset(client, auth_headers):
    _make(client, auth_headers, at="09:00:00", message="now")
    r = client.get(
        "/api/v1/reminders/due",
        params={"now": "2026-11-02T09:01:00+05:00"},
        headers=auth_headers,
    )
    assert [x["message"] for x in r.json()] == ["now"]
