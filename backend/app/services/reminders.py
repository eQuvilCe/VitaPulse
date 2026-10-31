from datetime import datetime, time, timedelta

from app.models import Reminder


def is_due(reminder: Reminder, now: datetime, window_minutes: int = 5) -> bool:
    """True if an enabled reminder falls within the last `window_minutes` before `now`."""
    if not reminder.enabled:
        return False
    scheduled = datetime.combine(now.date(), reminder.at)
    if not 0 <= (now - scheduled).total_seconds() < window_minutes * 60:
        return False
    return str(now.weekday()) in reminder.days.split(",")


def next_fire(reminder: Reminder, now: datetime) -> datetime | None:
    """Next datetime this reminder fires at or after `now`, or None when disabled."""
    if not reminder.enabled:
        return None
    days = {int(d) for d in reminder.days.split(",") if d}
    for offset in range(8):
        day = now.date() + timedelta(days=offset)
        candidate = datetime.combine(day, reminder.at)
        if day.weekday() in days and candidate >= now:
            return candidate
    return None


def parse_clock(value: str) -> time:
    return time.fromisoformat(value)
