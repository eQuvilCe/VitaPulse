import httpx


class TelegramClient:
    def __init__(self, token: str) -> None:
        self._client = httpx.Client(base_url=f"https://api.telegram.org/bot{token}", timeout=40)

    def get_updates(self, offset: int | None) -> list[dict]:
        params = {"timeout": 30, **({"offset": offset} if offset is not None else {})}
        r = self._client.get("/getUpdates", params=params)
        r.raise_for_status()
        return r.json().get("result", [])

    def send_message(self, chat_id: int, text: str) -> None:
        self._client.post(
            "/sendMessage", json={"chat_id": chat_id, "text": text}
        ).raise_for_status()
