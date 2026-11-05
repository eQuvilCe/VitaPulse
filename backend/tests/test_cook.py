from datetime import date

from app.schemas.cook import AICook, AISwaps
from app.services import ai, cook, templates
from tests.conftest import PLAN_INPUT

FRIDGE = ["chicken", "rice", "broccoli", "eggs"]


def test_recipe_bank_has_30_plus():
    assert len(templates.RECIPES) >= 30
    assert all(i in cook.KEYWORDS for r in templates.RECIPES for i in r["ingredients"])


def test_fridge_matching_uses_word_starts():
    assert cook.matches(["Курица", "клубника", "Яйца"]) == {"chicken", "berries", "eggs"}
    assert "onion" not in cook.matches(["клубника"])


def test_step_timers():
    assert cook.step_timer("Bake at 200 °C for 12–14 minutes.") == 840
    assert cook.step_timer("Варите 9 минут") == 540
    assert cook.step_timer("Взбивайте 1 минуту") == 60
    assert cook.step_timer("Season to taste") is None


def test_suggest_from_fridge(client, auth_headers):
    r = client.post(
        "/api/v1/cook/suggest", json={"ingredients": FRIDGE, "kcal": 550}, headers=auth_headers
    )
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "template" and body["kcal_target"] == 550
    assert len(body["recipes"]) == 3
    best = body["recipes"][0]
    assert best["key"] == "chicken_rice_bowl" and best["missing"] == []
    assert best["calories"] == 550 and all(i["have"] for i in best["ingredients"])
    assert any(s["timer_sec"] for s in best["steps"])
    assert "high_protein" in best["tags"]


def test_suggest_respects_restrictions_time_and_servings(client, auth_headers):
    body = client.post(
        "/api/v1/cook/suggest",
        json={
            "ingredients": ["tofu", "spinach"],
            "restrictions": ["vegan"],
            "time_min": 20,
            "servings": 2,
            "language": "ru",
        },
        headers=auth_headers,
    ).json()
    keys = [r["key"] for r in body["recipes"]]
    vegan = {r["id"] for r in templates.RECIPES if not r["tags"] & {"meat", "fish", "dairy", "egg"}}
    assert set(keys) <= vegan and keys[0] == "tofu_scramble"
    assert all(r["time_min"] <= 20 for r in body["recipes"])
    assert body["recipes"][0]["servings"] == 2 and body["recipes"][0]["name"].startswith("Скрэмбл")
    tofu = next(i for i in body["recipes"][0]["ingredients"] if i["name"].startswith("Тофу"))
    assert tofu["amount"] >= 150


def test_default_kcal_comes_from_the_plan(client, auth_headers):
    client.post("/api/v1/plan", json=PLAN_INPUT, headers=auth_headers)
    body = client.post(
        "/api/v1/cook/suggest",
        json={"ingredients": FRIDGE, "meal_type": "dinner"},
        headers=auth_headers,
    ).json()
    assert body["kcal_target"] == 480  # 30% of 1600
    assert all(r["meal_type"] == "dinner" for r in body["recipes"])


def test_suggest_uses_ai_when_available(client, auth_headers, monkeypatch):
    fake = AICook.model_validate(
        {
            "recipes": [
                {
                    "name": "Chicken fried rice",
                    "description": "Quick",
                    "meal_type": "dinner",
                    "time_min": 20,
                    "calories": 520,
                    "protein_g": 40,
                    "fat_g": 12,
                    "carbs_g": 55,
                    "ingredients": [
                        {"name": "Chicken", "amount": 150, "unit": "g", "have": True},
                        {"name": "Peas", "amount": 50, "unit": "g", "have": False},
                    ],
                    "steps": [{"text": "Fry for 5 minutes", "timer_sec": 300}],
                    "tags": ["quick", "bad"],
                }
            ]
        }
    )
    monkeypatch.setattr(ai, "structured", lambda *a, **kw: fake)
    body = client.post(
        "/api/v1/cook/suggest", json={"ingredients": FRIDGE, "kcal": 500}, headers=auth_headers
    ).json()
    assert body["source"] == "ai"
    r = body["recipes"][0]
    assert r["key"].startswith("ai-") and r["missing"] == ["Peas"] and r["tags"] == ["quick"]


def test_swap_template(client, auth_headers):
    r = client.post(
        "/api/v1/cook/swap",
        json={"dish": "Pasta carbonara", "ingredients": ["bacon", "cream", "parmesan"]},
        headers=auth_headers,
    )
    body = r.json()
    assert body["source"] == "template"
    assert {s["from"] for s in body["swaps"]} >= {"cream", "bacon", "pasta"}
    assert body["kcal_saved_total"] == sum(s["kcal_saved"] for s in body["swaps"]) > 0
    assert body["tips"]


def test_swap_ai(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        ai,
        "structured",
        lambda *a, **kw: AISwaps.model_validate(
            {
                "swaps": [
                    {"original": "oil", "replacement": "spray", "why": "less fat", "kcal_saved": 90}
                ],
                "tips": ["Bake"],
            }
        ),
    )
    body = client.post(
        "/api/v1/cook/swap", json={"dish": "Fries", "goal": "less_fat"}, headers=auth_headers
    ).json()
    assert body["source"] == "ai" and body["swaps"][0] == {
        "from": "oil",
        "to": "spray",
        "why": "less fat",
        "kcal_saved": 90,
    }


def _recipe(client, headers):
    return client.post(
        "/api/v1/cook/suggest", json={"ingredients": ["chicken"], "kcal": 500}, headers=headers
    ).json()["recipes"][0]


def test_favorites_crud(client, auth_headers):
    recipe = _recipe(client, auth_headers)
    r = client.post("/api/v1/cook/favorites", json={"recipe": recipe}, headers=auth_headers)
    assert r.status_code == 201
    fav = r.json()
    assert fav["recipe"]["key"] == recipe["key"]
    assert (
        client.post(
            "/api/v1/cook/favorites", json={"recipe": recipe}, headers=auth_headers
        ).status_code
        == 409
    )
    r = client.patch(
        f"/api/v1/cook/favorites/{fav['id']}", json={"note": "Tasty"}, headers=auth_headers
    )
    assert r.json()["note"] == "Tasty"
    assert len(client.get("/api/v1/cook/favorites", headers=auth_headers).json()) == 1
    assert (
        client.delete(f"/api/v1/cook/favorites/{fav['id']}", headers=auth_headers).status_code
        == 204
    )
    assert client.get("/api/v1/cook/favorites", headers=auth_headers).json() == []


def test_recipe_to_diary(client, auth_headers):
    recipe = _recipe(client, auth_headers)
    r = client.post(
        "/api/v1/cook/diary", json={"recipe": recipe, "servings_eaten": 1.5}, headers=auth_headers
    )
    assert r.status_code == 201
    meal = r.json()["meal"]
    assert meal["source"] == "cook" and meal["calories"] == round(recipe["calories"] * 1.5)
    assert r.json()["new_achievements"] == ["first_meal"]
    diary = client.get(f"/api/v1/diary?day={date.today()}", headers=auth_headers).json()
    assert diary["totals"]["calories"] == meal["calories"]


def test_missing_to_shopping_list(client, auth_headers):
    recipe = client.post(
        "/api/v1/cook/suggest", json={"ingredients": ["chicken"], "kcal": 550}, headers=auth_headers
    ).json()["recipes"][0]
    assert recipe["missing"]
    items = client.post(
        "/api/v1/cook/missing", json={"recipe": recipe}, headers=auth_headers
    ).json()
    assert {i["name"] for i in items} == set(recipe["missing"])
    assert all(i["source"] == "cook" for i in items)
    again = client.post(
        "/api/v1/cook/missing", json={"recipe": recipe}, headers=auth_headers
    ).json()
    assert len(again) == len(items)


def test_shopping_list_crud(client, auth_headers):
    r = client.post(
        "/api/v1/shopping",
        json={
            "items": [
                {"name": "Milk", "amount": 1, "unit": "l"},
                {"name": "milk", "amount": 1, "unit": "l"},
                {"name": "Apples"},
            ]
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    items = r.json()
    assert [(i["name"], i["amount"]) for i in items] == [("Apples", None), ("Milk", 2)]
    milk = items[1]
    r = client.patch(f"/api/v1/shopping/{milk['id']}", json={"checked": True}, headers=auth_headers)
    assert r.json()["checked"]
    listed = client.get("/api/v1/shopping", headers=auth_headers).json()
    assert [i["name"] for i in listed] == ["Apples", "Milk"]
    assert client.delete("/api/v1/shopping?checked=true", headers=auth_headers).status_code == 204
    assert [i["name"] for i in client.get("/api/v1/shopping", headers=auth_headers).json()] == [
        "Apples"
    ]
    assert client.delete("/api/v1/shopping", headers=auth_headers).status_code == 204
    assert client.get("/api/v1/shopping", headers=auth_headers).json() == []


def test_cook_needs_auth(client):
    assert client.post("/api/v1/cook/suggest", json={"ingredients": ["x"]}).status_code == 401
    assert client.get("/api/v1/shopping").status_code == 401
