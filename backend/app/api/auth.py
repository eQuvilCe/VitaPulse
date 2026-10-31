from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.config import settings
from app.models import User
from app.schemas.user import PasswordChange, Token, UserCreate, UserRead, UserUpdate
from app.security import create_access_token, hash_password, verify_password
from app.services import google

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: DbSession) -> User:
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        email=email,
        password_hash=hash_password(data.password),
        name=data.name,
        language=data.language,
    )
    db.add(user)
    db.commit()
    return user


@router.post("/login", response_model=Token)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession) -> Token:
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if (
        user is None
        or not user.password_hash
        or not verify_password(form.password, user.password_hash)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserRead)
def update_me(data: UserUpdate, user: CurrentUser, db: DbSession) -> User:
    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, key, value)
    db.commit()
    return user


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(data: PasswordChange, user: CurrentUser, db: DbSession) -> None:
    # Accounts created through Google may set a first password without the current one.
    if user.password_hash and not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if data.new_password == data.current_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "New password must be different")
    user.password_hash = hash_password(data.new_password)
    db.commit()


def _frontend_redirect(fragment: dict[str, str]) -> RedirectResponse:
    # The token travels in the fragment, so it never reaches server logs or Referer headers.
    url = f"{settings.frontend_url.rstrip('/')}/auth/callback#{urlencode(fragment)}"
    return RedirectResponse(url, status_code=status.HTTP_302_FOUND)


@router.get("/google/status")
def google_status() -> dict[str, bool]:
    return {"enabled": settings.google_enabled}


@router.get("/google/login")
def google_login(next: str = "/") -> RedirectResponse:
    if not settings.google_enabled:
        return _frontend_redirect({"error": "google_disabled"})
    return RedirectResponse(google.authorize_url(google.make_state(next)))


def google_user(db: DbSession, profile: google.GoogleProfile) -> User:
    """Find the account for a Google profile, linking or creating it as needed."""
    user = db.scalar(select(User).where(User.google_sub == profile.sub))
    if user is None:
        user = db.scalar(select(User).where(User.email == profile.email))
        if user is None:
            user = User(email=profile.email, name=profile.name[:100], password_hash="")
            db.add(user)
        user.google_sub = profile.sub
        db.commit()
    return user


@router.get("/google/callback")
def google_callback(
    db: DbSession, code: str | None = None, state: str | None = None, error: str | None = None
) -> RedirectResponse:
    if not settings.google_enabled:
        return _frontend_redirect({"error": "google_disabled"})
    try:
        next_path = google.read_state(state or "")
        if error or not code:
            raise google.GoogleError("google_failed")
        user = google_user(db, google.fetch_profile(code))
    except google.GoogleError as e:
        return _frontend_redirect({"error": str(e)})
    return _frontend_redirect({"access_token": create_access_token(user.id), "next": next_path})
