from datetime import date, timedelta

from app.services.dates import is_future


def test_today_and_past_are_not_future():
    assert not is_future(date.today())
    assert not is_future(date.today() - timedelta(days=400))


def test_tomorrow_is_allowed_for_timezone_slack():
    assert not is_future(date.today() + timedelta(days=1))


def test_two_days_ahead_is_future():
    assert is_future(date.today() + timedelta(days=2))
