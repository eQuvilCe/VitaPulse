import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    telegram_token: str
    api_url: str
    session_file: str

    @classmethod
    def from_env(cls) -> "Config":
        token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        if not token:
            raise SystemExit("TELEGRAM_BOT_TOKEN is not set")
        return cls(
            telegram_token=token,
            api_url=os.environ.get("VITAPULSE_API_URL", "http://localhost:8000/api/v1").rstrip("/"),
            session_file=os.environ.get("VITABOT_SESSIONS", "sessions.json"),
        )
