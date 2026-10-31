# VitaPulse Telegram bot

Log water, steps and weight from Telegram. The bot talks to the VitaPulse REST API
(`/api/v1/metrics`) with a per-chat access token.

## Run

```bash
cd bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export TELEGRAM_BOT_TOKEN=<token from @BotFather>
export VITAPULSE_API_URL=http://localhost:8000/api/v1   # default
python -m vitabot
```

Commands: `/login <email> <password>`, `/water 250`, `/steps 3000`, `/weight 72.5`, `/logout`.

Tokens are stored in `sessions.json` (override with `VITABOT_SESSIONS`). Delete your `/login`
message in the chat afterwards, since it contains your password.

## Tests

```bash
pip install -r requirements-dev.txt
ruff check . && pytest
```
