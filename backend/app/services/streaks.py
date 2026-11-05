from collections.abc import Iterable
from datetime import date, timedelta


def current_streak(days: Iterable[date], today: date) -> int:
    """Consecutive days ending today, or yesterday if today is not logged yet."""
    done = set(days)
    cursor = today if today in done else today - timedelta(days=1)
    streak = 0
    while cursor in done:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def longest_streak(days: Iterable[date]) -> int:
    best = run = 0
    prev: date | None = None
    for d in sorted(set(days)):
        run = run + 1 if prev is not None and d - prev == timedelta(days=1) else 1
        best = max(best, run)
        prev = d
    return best
