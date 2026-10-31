from datetime import date

import httpx


class ApiError(Exception):
    def __init__(self, status: int, detail: str) -> None:
        super().__init__(detail)
        self.status = status
        self.detail = detail


class VitaApi:
    def __init__(self, base_url: str, client: httpx.Client | None = None) -> None:
        self._client = client or httpx.Client(base_url=base_url, timeout=15)

    def _request(self, method: str, path: str, token: str | None = None, **kw) -> dict | list:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        r = self._client.request(method, path, headers=headers, **kw)
        if r.status_code >= 400:
            try:
                detail = r.json().get("detail", r.text)
            except ValueError:
                detail = r.text
            raise ApiError(r.status_code, str(detail))
        return r.json() if r.content else {}

    def login(self, email: str, password: str) -> str:
        data = self._request("POST", "/auth/login", data={"username": email, "password": password})
        return data["access_token"]

    def add_metric(self, token: str, kind: str, delta: float) -> dict:
        body = {"day": date.today().isoformat(), "delta": delta}
        return self._request("POST", f"/metrics/{kind}/add", token, json=body)

    def set_metric(self, token: str, kind: str, value: float) -> dict:
        body = {"day": date.today().isoformat(), "value": value}
        return self._request("PUT", f"/metrics/{kind}", token, json=body)
