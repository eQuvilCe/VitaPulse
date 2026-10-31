import logging
import time

import httpx

from vitabot.api import VitaApi
from vitabot.config import Config
from vitabot.handlers import handle_message
from vitabot.sessions import SessionStore
from vitabot.telegram import TelegramClient

log = logging.getLogger("vitabot")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    cfg = Config.from_env()
    tg = TelegramClient(cfg.telegram_token)
    api = VitaApi(cfg.api_url)
    sessions = SessionStore(cfg.session_file)
    offset: int | None = None
    log.info("bot started, api at %s", cfg.api_url)
    while True:
        try:
            for update in tg.get_updates(offset):
                offset = update["update_id"] + 1
                msg = update.get("message") or {}
                if "text" not in msg:
                    continue
                chat_id = msg["chat"]["id"]
                tg.send_message(chat_id, handle_message(chat_id, msg["text"], api, sessions))
        except httpx.HTTPError as e:
            log.warning("network error: %s", e)
            time.sleep(5)


if __name__ == "__main__":
    main()
