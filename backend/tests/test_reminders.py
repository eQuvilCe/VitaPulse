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
