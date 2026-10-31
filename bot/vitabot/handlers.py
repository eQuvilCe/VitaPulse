from vitabot.api import ApiError, VitaApi
from vitabot.sessions import SessionStore

HELP = (
    "VitaPulse bot\n"
    "/login <email> <password> - connect your account\n"
    "/water <ml> - add water, e.g. /water 250\n"
    "/steps <n> - add steps\n"
    "/weight <kg> - set today's weight\n"
    "/logout - disconnect"
)

# command -> (metric kind, "add" accumulates, "set" overwrites, unit label)
METRIC_COMMANDS = {
    "water": ("water", "add", "ml"),
    "steps": ("steps", "add", "steps"),
    "weight": ("weight", "set", "kg"),
}


def handle_message(chat_id: int, text: str, api: VitaApi, sessions: SessionStore) -> str:
    parts = text.strip().split()
    if not parts or not parts[0].startswith("/"):
        return HELP
    command = parts[0][1:].split("@")[0].lower()
    args = parts[1:]

    if command in ("start", "help"):
        return HELP
    if command == "login":
        if len(args) != 2:
            return "Usage: /login <email> <password>"
        try:
            sessions.set(chat_id, api.login(args[0], args[1]))
        except ApiError:
            return "Login failed, check your email and password."
        return "Connected. Try /water 250"
    if command == "logout":
        sessions.drop(chat_id)
        return "Disconnected."
    if command in METRIC_COMMANDS:
        return _log_metric(chat_id, command, args, api, sessions)
    return HELP


def _log_metric(
    chat_id: int, command: str, args: list[str], api: VitaApi, sessions: SessionStore
) -> str:
    token = sessions.get(chat_id)
    if token is None:
        return "Please /login first."
    kind, mode, unit = METRIC_COMMANDS[command]
    try:
        amount = float(args[0].replace(",", "."))
    except (IndexError, ValueError):
        return f"Usage: /{command} <number>"
    if amount <= 0:
        return "The value must be positive."
    try:
        if mode == "add":
            row = api.add_metric(token, kind, amount)
        else:
            row = api.set_metric(token, kind, amount)
    except ApiError as e:
        if e.status == 401:
            sessions.drop(chat_id)
            return "Session expired, please /login again."
        return f"Could not save: {e.detail}"
    total = row.get("value", amount)
    return f"Saved. Today: {total:g} {unit}"
