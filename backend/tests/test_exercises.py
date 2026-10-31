from app.services import exercise_catalog as catalog


def test_catalog_is_complete_and_bilingual():
    assert len(catalog.EXERCISES) >= 40
    ids = [e["id"] for e in catalog.EXERCISES]
    assert len(ids) == len(set(ids))
    for ex in catalog.EXERCISES:
        for lang in ("en", "ru"):
            t = ex["text"][lang]
            assert t["name"] and t["description"] and len(t["steps"]) >= 2 and t["mistakes"]
        assert ex["met"] > 0 and ex["places"] and ex["equipment"]


def test_ready_workouts_reference_known_exercises():
    for w in catalog.WORKOUTS:
        assert all(ex_id in catalog.BY_ID for ex_id, _ in w["items"])


def test_kcal_per_min_from_met():
    # 8 MET * 3.5 * 70 / 200 = 9.8
    assert catalog.kcal_per_min(8.0, 70) == 9.8


def test_list_and_filter(client):
    all_ = client.get("/api/v1/exercises").json()
    assert len(all_) >= 40
    hiit_home = client.get("/api/v1/exercises?tag=hiit&place=home").json()
    assert hiit_home and all("hiit" in e["tags"] and "home" in e["places"] for e in hiit_home)
    core = client.get("/api/v1/exercises?muscle=core&level=beginner").json()
    assert all("core" in e["muscles"] and e["level"] == "beginner" for e in core)
    ru = client.get("/api/v1/exercises?q=планка&lang=ru").json()
    assert {e["id"] for e in ru} >= {"plank", "side_plank"}
    assert ru[0]["name"][0].isalpha() and ru[0]["image_url"] is None
    assert client.get("/api/v1/exercises?equipment=kettlebell").json()
    assert client.get("/api/v1/exercises?tag=yoga").status_code == 422


def test_get_exercise_scales_with_weight(client):
    light = client.get("/api/v1/exercises/jumping_jacks?weight_kg=60").json()
    heavy = client.get("/api/v1/exercises/jumping_jacks?weight_kg=100&lang=ru").json()
    assert heavy["kcal_per_min"] > light["kcal_per_min"]
    assert heavy["name"] == "Прыжки «звёздочка»" and heavy["dosage"]["mode"] == "time"
    assert client.get("/api/v1/exercises/nope").status_code == 404


def test_ready_workouts(client):
    home = client.get("/api/v1/workouts?place=home&max_minutes=15").json()
    assert {w["id"] for w in home} >= {"hiit_15_home", "core_10"}
    hiit = client.get("/api/v1/workouts/hiit_15_home?lang=ru").json()
    assert hiit["title"] == "HIIT 15 минут дома" and hiit["kcal_estimate"] > 50
    assert hiit["items"][0]["seconds"] == 40 and hiit["equipment"] == ["none"]
    assert client.get("/api/v1/workouts/nope").status_code == 404


def test_complete_counts_as_check_in(client, auth_headers):
    r = client.post(
        "/api/v1/workouts/hiit_15_home/complete", json={"duration_min": 30}, headers=auth_headers
    )
    assert r.status_code == 201
    w = r.json()["workout"]
    assert w["program_id"] == "hiit_15_home" and w["kind"] == "cardio"
    assert w["duration_min"] == 30 and w["kcal"] > 150
    logs = client.get("/api/v1/progress/workouts", headers=auth_headers).json()
    assert logs[0]["title"] == "15-minute HIIT at home"
    for _ in range(9):
        r = client.post("/api/v1/workouts/core_10/complete", headers=auth_headers)
    assert r.json()["new_achievements"] == ["workouts_10"]
    assert client.post("/api/v1/workouts/core_10/complete").status_code == 401
