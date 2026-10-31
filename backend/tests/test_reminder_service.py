from datetime import datetime, time

from app.models import Reminder
from app.services.reminders import is_due, next_fire


def _r(**kw) -> Reminder:
    base = {"kind": "water", "at": time(9, 0), "days": "0,1,2,3,4,5,6", "enabled": True}
    return Reminder(**{**base, **kw})


def test_is_due_inside_window():
    assert is_due(_r(), datetime(2026, 11, 2, 9, 3))
    assert not is_due(_r(), datetime(2026, 11, 2, 8, 59))
    assert not is_due(_r(), datetime(2026, 11, 2, 9, 5))


def test_is_due_respects_weekdays_and_enabled():
    monday = datetime(2026, 11, 2, 9, 1)
    assert not is_due(_r(days="1,2"), monday)
    assert not is_due(_r(enabled=False), monday)


def test_next_fire_skips_to_allowed_day():
    # 2026-11-02 is a Monday; reminder only on Wednesday (2)
    assert next_fire(_r(days="2"), datetime(2026, 11, 2, 10, 0)) == datetime(2026, 11, 4, 9, 0)
    assert next_fire(_r(enabled=False), datetime(2026, 11, 2, 10, 0)) is None


def test_next_fire_later_today():
    assert next_fire(_r(), datetime(2026, 11, 2, 8, 0)) == datetime(2026, 11, 2, 9, 0)
