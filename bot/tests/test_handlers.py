import httpx
import pytest

from vitabot.api import VitaApi
from vitabot.handlers import handle_message
from vitabot.sessions import SessionStore


def make_api(calls: list) -> VitaApi:
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append((request.method, request.url.path))
        if request.url.path == "/auth/login":
            if b"good" in request.content:
                return httpx.Response(200, json={"access_token": "tok"})
            return httpx.Response(401, json={"detail": "bad"})
        if request.headers.get("authorization") != "Bearer tok":
            return httpx.Response(401, json={"detail": "expired"})
        return httpx.Response(200, json={"value": 750})

    client = httpx.Client(base_url="http://api", transport=httpx.MockTransport(handler))
    return VitaApi("http://api", client)


@pytest.fixture()
def sessions(tmp_path):
    return SessionStore(str(tmp_path / "s.json"))


def test_requires_login(sessions):
    assert "login" in handle_message(1, "/water 250", make_api([]), sessions)


def test_login_and_log_water(sessions):
    calls: list = []
    api = make_api(calls)
    assert "Connected" in handle_message(1, "/login a@b.co good", api, sessions)
    reply = handle_message(1, "/water 250", api, sessions)
    assert reply == "Saved. Today: 750 ml"
    assert ("POST", "/metrics/water/add") in calls


def test_bad_login(sessions):
    assert "failed" in handle_message(1, "/login a@b.co nope", make_api([]), sessions)
    assert sessions.get(1) is None


def test_weight_uses_set(sessions):
    calls: list = []
    api = make_api(calls)
    handle_message(1, "/login a@b.co good", api, sessions)
    handle_message(1, "/weight 72,5", api, sessions)
    assert ("PUT", "/metrics/weight") in calls


def test_rejects_non_numbers(sessions):
    api = make_api([])
    handle_message(1, "/login a@b.co good", api, sessions)
    assert "Usage" in handle_message(1, "/water lots", api, sessions)
    assert "positive" in handle_message(1, "/steps -5", api, sessions)


def test_expired_session_is_dropped(sessions):
    sessions.set(1, "old")
    assert "expired" in handle_message(1, "/water 100", make_api([]), sessions)
    assert sessions.get(1) is None


def test_sessions_persist(tmp_path):
    path = str(tmp_path / "s.json")
    SessionStore(path).set(5, "abc")
    assert SessionStore(path).get(5) == "abc"
