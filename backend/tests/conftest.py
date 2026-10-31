from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db() -> Iterator:
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    client.post("/api/v1/auth/register", json={"email": "a@b.co", "password": "password123"})
    r = client.post("/api/v1/auth/login", data={"username": "a@b.co", "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(autouse=True)
def offline(monkeypatch, tmp_path):
    """No real AI or Google calls in tests, and uploads go to a temp folder."""
    from app.config import settings

    monkeypatch.setattr(settings, "anthropic_api_key", "")
    monkeypatch.setattr(settings, "google_client_id", "")
    monkeypatch.setattr(settings, "google_client_secret", "")
    monkeypatch.setattr(settings, "media_dir", str(tmp_path / "media"))


PLAN_INPUT = {
    "height_cm": 170,
    "weight_kg": 82,
    "age": 31,
    "sex": "female",
    "goal": "lose",
    "goal_kg": 6,
    "activity": "light",
    "location": "home",
    "restrictions": [],
    "meals_per_day": 4,
}
