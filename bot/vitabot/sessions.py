import json
import os
from pathlib import Path


class SessionStore:
    """Maps Telegram chat ids to VitaPulse access tokens, persisted as a small JSON file."""

    def __init__(self, path: str) -> None:
        self._path = Path(path)
        self._data: dict[str, str] = {}
        if self._path.exists():
            self._data = json.loads(self._path.read_text() or "{}")

    def get(self, chat_id: int) -> str | None:
        return self._data.get(str(chat_id))

    def set(self, chat_id: int, token: str) -> None:
        self._data[str(chat_id)] = token
        self._save()

    def drop(self, chat_id: int) -> None:
        if self._data.pop(str(chat_id), None) is not None:
            self._save()

    def _save(self) -> None:
        fd = os.open(self._path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(json.dumps(self._data))
        os.chmod(self._path, 0o600)
