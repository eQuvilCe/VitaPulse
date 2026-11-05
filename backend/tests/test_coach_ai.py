from datetime import date, timedelta

from app.services import advisor, ai
from tests.conftest import PLAN_INPUT


def test_daily_tip_without_plan(client, auth_headers):
    r = client.get("/api/v1/tips/daily", headers=auth_headers)
    tip = r.json()
    assert tip["source"] == "template" and tip["category"] == "motivation"
    assert tip["day"] == date.today().isoformat()


def test_daily_tip_is_cached_per_day(client, auth_headers, monkeypatch):
    first = client.get("/api/v1/tips/daily", headers=auth_headers).json()
    monkeypatch.setattr(
        ai, "structured", lambda *a, **kw: advisor.Tip(title="New", text="t", category="water")
    )
    assert client.get("/api/v1/tips/daily", headers=auth_headers).json() == first
    fresh = client.get("/api/v1/tips/daily?refresh=true", headers=auth_headers).json()
    assert fresh["title"] == "New" and fresh["source"] == "ai"


def test_daily_tip_flags_low_protein(client, auth_headers):
    client.post("/api/v1/plan", json={**PLAN_INPUT, "language": "en"}, headers=auth_headers)
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    client.post(
        "/api/v1/meals",
        json={"day": yesterday, "name": "Toast", "calories": 1500, "protein_g": 20},
        headers=auth_headers,
    )
    tip = client.get("/api/v1/tips/daily", headers=auth_headers).json()
    assert tip["title"] == "Protein first" and "20 g" in tip["text"]


def test_chat_offline_reply_and_history(client, auth_headers):
    r = client.post(
        "/api/v1/chat", json={"message": "Сколько мне нужно белка?"}, headers=auth_headers
    )
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "template" and "белка" in body["reply"]["content"]
    history = client.get("/api/v1/chat", headers=auth_headers).json()
    assert [m["role"] for m in history] == ["user", "assistant"]
    assert client.delete("/api/v1/chat", headers=auth_headers).status_code == 204
    assert client.get("/api/v1/chat", headers=auth_headers).json() == []


def test_chat_sends_history_to_ai(client, auth_headers, monkeypatch):
    calls = []

    def fake_chat(system, messages, **kw):
        calls.append(messages)
        return f"answer {len(messages)}"

    monkeypatch.setattr(ai, "chat", fake_chat)
    client.post("/api/v1/chat", json={"message": "hi"}, headers=auth_headers)
    r = client.post("/api/v1/chat", json={"message": "and protein?"}, headers=auth_headers)
    assert r.json()["reply"]["content"] == "answer 3"
    assert [m["role"] for m in calls[-1]] == ["user", "assistant", "user"]


def test_ai_is_off_without_key():
    try:
        ai.chat("s", [{"role": "user", "content": "x"}])
    except ai.AIUnavailable:
        pass
    else:
        raise AssertionError("expected AIUnavailable")
