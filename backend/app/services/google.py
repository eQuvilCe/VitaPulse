"""Google OAuth 2.0 authorization-code flow (server side)."""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx
import jwt

from app.config import settings
from app.security import ALGORITHM

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
STATE_PURPOSE = "google_oauth"


class GoogleError(Exception):
    pass


@dataclass(frozen=True)
class GoogleProfile:
    sub: str
    email: str
    name: str


def safe_next(path: str | None) -> str:
    """Only same-site relative paths, so the redirect can't be turned into an open one."""
    if not path or not path.startswith("/") or path.startswith("//") or "\\" in path:
        return "/"
    return path[:200]


def make_state(next_path: str) -> str:
    claims = {
        "purpose": STATE_PURPOSE,
        "next": safe_next(next_path),
        "exp": datetime.now(UTC) + timedelta(minutes=10),
    }
    return jwt.encode(claims, settings.secret_key, algorithm=ALGORITHM)


def read_state(state: str) -> str:
    try:
        claims = jwt.decode(state, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError as e:
        raise GoogleError("invalid_state") from e
    if claims.get("purpose") != STATE_PURPOSE:
        raise GoogleError("invalid_state")
    return safe_next(claims.get("next"))


def authorize_url(state: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def fetch_profile(code: str) -> GoogleProfile:
    """Exchange the code for tokens and read the verified profile."""
    try:
        with httpx.Client(timeout=10) as client:
            token = client.post(
                TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token.raise_for_status()
            info = client.get(
                USERINFO_URL,
                headers={"Authorization": f"Bearer {token.json()['access_token']}"},
            )
            info.raise_for_status()
            data = info.json()
    except (httpx.HTTPError, KeyError, ValueError) as e:
        raise GoogleError("google_failed") from e
    if not data.get("sub") or not data.get("email") or not data.get("email_verified"):
        raise GoogleError("google_failed")
    return GoogleProfile(sub=data["sub"], email=data["email"].lower(), name=data.get("name", ""))
