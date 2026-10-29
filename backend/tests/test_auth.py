def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_register_and_login(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "User@Example.com", "password": "password123", "language": "ru"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "user@example.com"
    assert "password" not in r.json()

    r = client.post(
        "/api/v1/auth/login", data={"username": "user@example.com", "password": "password123"}
    )
    assert r.status_code == 200
    token = r.json()["access_token"]

    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.json()["language"] == "ru"


def test_duplicate_email(client):
    body = {"email": "a@b.co", "password": "password123"}
    assert client.post("/api/v1/auth/register", json=body).status_code == 201
    assert client.post("/api/v1/auth/register", json=body).status_code == 409


def test_bad_password(client):
    client.post("/api/v1/auth/register", json={"email": "a@b.co", "password": "password123"})
    r = client.post("/api/v1/auth/login", data={"username": "a@b.co", "password": "wrong"})
    assert r.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/v1/auth/me").status_code == 401
