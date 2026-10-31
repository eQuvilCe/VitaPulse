from urllib.parse import parse_qs, urlparse

import pytest

from app.config import settings
from app.services import google


@pytest.fixture()
def google_on(monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "cid")
    monkeypatch.setattr(settings, "google_client_secret", "secret")
    monkeypatch.setattr(settings, "frontend_url", "http://front")


def _fragment(location: str) -> dict:
    return {k: v[0] for k, v in parse_qs(urlparse(location).fragment).items()}


def test_status_and_disabled_login(client):
    assert client.get("/api/v1/auth/google/status").json() == {"enabled": False}
    r = client.get("/api/v1/auth/google/login", follow_redirects=False)
    assert _fragment(r.headers["location"])["error"] == "google_disabled"


def test_login_redirects_to_google(client, google_on):
    r = client.get("/api/v1/auth/google/login?next=/app", follow_redirects=False)
    url = urlparse(r.headers["location"])
    assert url.netloc == "accounts.google.com"
    qs = parse_qs(url.query)
    assert qs["client_id"] == ["cid"] and google.read_state(qs["state"][0]) == "/app"


def test_callback_creates_then_reuses_account(client, google_on, monkeypatch):
    profile = google.GoogleProfile(sub="g-1", email="new@gmail.com", name="New")
    monkeypatch.setattr(google, "fetch_profile", lambda code: profile)
    state = google.make_state("/app")
    r = client.get(f"/api/v1/auth/google/callback?code=c&state={state}", follow_redirects=False)
    frag = _fragment(r.headers["location"])
    assert r.headers["location"].startswith("http://front/auth/callback#")
    assert frag["next"] == "/app"
    me = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {frag['access_token']}"}
    ).json()
    assert me["email"] == "new@gmail.com" and me["google_linked"] and not me["has_password"]

    r2 = client.get(f"/api/v1/auth/google/callback?code=c&state={state}", follow_redirects=False)
    token2 = _fragment(r2.headers["location"])["access_token"]
    me2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token2}"}).json()
    assert me2["id"] == me["id"]

    # a Google-only account can't log in with a password but can set one
    assert client.post(
        "/api/v1/auth/login", data={"username": "new@gmail.com", "password": ""}
    ).status_code in (401, 422)
    h = {"Authorization": f"Bearer {token2}"}
    assert (
        client.post(
            "/api/v1/auth/password", json={"new_password": "password123"}, headers=h
        ).status_code
        == 204
    )
    assert (
        client.post(
            "/api/v1/auth/login", data={"username": "new@gmail.com", "password": "password123"}
        ).status_code
        == 200
    )


def test_callback_links_existing_email(client, google_on, auth_headers, monkeypatch):
    monkeypatch.setattr(
        google,
        "fetch_profile",
        lambda code: google.GoogleProfile(sub="g-2", email="a@b.co", name=""),
    )
    state = google.make_state("/")
    r = client.get(f"/api/v1/auth/google/callback?code=c&state={state}", follow_redirects=False)
    assert "access_token" in _fragment(r.headers["location"])
    me = client.get("/api/v1/auth/me", headers=auth_headers).json()
    assert me["google_linked"] and me["has_password"]


def test_callback_rejects_bad_state(client, google_on):
    r = client.get("/api/v1/auth/google/callback?code=c&state=junk", follow_redirects=False)
    assert _fragment(r.headers["location"])["error"] == "invalid_state"


def test_next_cannot_leave_the_site():
    assert google.safe_next("//evil.com") == "/"
    assert google.safe_next("https://evil.com") == "/"
    assert google.safe_next("/app/plan") == "/app/plan"
