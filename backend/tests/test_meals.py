def _meal(**kw):
    return {"day": "2026-10-03", "name": "Plov", "calories": 600, "protein_g": 25, **kw}


def test_meal_crud(client, auth_headers):
    r = client.post("/api/v1/meals", json=_meal(), headers=auth_headers)
    assert r.status_code == 201
    mid = r.json()["id"]

    r = client.put(f"/api/v1/meals/{mid}", json=_meal(calories=700), headers=auth_headers)
    assert r.json()["calories"] == 700

    meals = client.get("/api/v1/meals?day=2026-10-03", headers=auth_headers).json()
    assert len(meals) == 1

    assert client.delete(f"/api/v1/meals/{mid}", headers=auth_headers).status_code == 204
    assert client.get("/api/v1/meals?day=2026-10-03", headers=auth_headers).json() == []


def test_totals_group_by_day(client, auth_headers):
    for day, kcal in (("2026-10-03", 500), ("2026-10-03", 300), ("2026-10-04", 900)):
        client.post("/api/v1/meals", json=_meal(day=day, calories=kcal), headers=auth_headers)
    r = client.get("/api/v1/meals/totals?start=2026-10-01&end=2026-10-31", headers=auth_headers)
    assert [(t["day"], t["calories"]) for t in r.json()] == [
        ("2026-10-03", 800),
        ("2026-10-04", 900),
    ]


def test_meal_rejects_negative_calories(client, auth_headers):
    r = client.post("/api/v1/meals", json=_meal(calories=-5), headers=auth_headers)
    assert r.status_code == 422


def test_unknown_meal_is_404(client, auth_headers):
    assert client.delete("/api/v1/meals/999", headers=auth_headers).status_code == 404
