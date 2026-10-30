import csv
import io


def _seed(client, headers):
    client.put(
        "/api/v1/sleep", json={"day": "2026-10-01", "minutes": 450, "quality": 4}, headers=headers
    )
    client.put("/api/v1/metrics/steps", json={"day": "2026-10-01", "value": 8000}, headers=headers)
    client.put("/api/v1/metrics/steps", json={"day": "2026-10-03", "value": 5000}, headers=headers)
    for cal in (300, 500):
        client.post(
            "/api/v1/meals",
            json={"day": "2026-10-01", "name": "x", "calories": cal},
            headers=headers,
        )


def test_export_json_merges_days(client, auth_headers):
    _seed(client, auth_headers)
    rows = client.get("/api/v1/export/daily", headers=auth_headers).json()
    assert [r["day"] for r in rows] == ["2026-10-01", "2026-10-03"]
    assert rows[0]["sleep_minutes"] == 450
    assert rows[0]["calories"] == 800
    assert rows[1]["steps"] == 5000


def test_export_respects_range(client, auth_headers):
    _seed(client, auth_headers)
    rows = client.get("/api/v1/export/daily?start=2026-10-02", headers=auth_headers).json()
    assert [r["day"] for r in rows] == ["2026-10-03"]


def test_export_csv(client, auth_headers):
    _seed(client, auth_headers)
    r = client.get("/api/v1/export/daily?fmt=csv", headers=auth_headers)
    assert r.headers["content-type"].startswith("text/csv")
    parsed = list(csv.DictReader(io.StringIO(r.text)))
    assert parsed[0]["steps"] == "8000.0"
    assert parsed[1]["sleep_minutes"] == ""


def test_export_requires_auth(client):
    assert client.get("/api/v1/export/daily").status_code == 401
