from datetime import date

from app.services.streaks import current_streak, longest_streak

D = date


def test_current_streak_counts_back_from_today():
    days = [D(2026, 10, 3), D(2026, 10, 4), D(2026, 10, 5)]
    assert current_streak(days, D(2026, 10, 5)) == 3


def test_streak_survives_until_end_of_today():
    days = [D(2026, 10, 3), D(2026, 10, 4)]
    assert current_streak(days, D(2026, 10, 5)) == 2


def test_streak_breaks_after_gap_day():
    assert current_streak([D(2026, 10, 1)], D(2026, 10, 5)) == 0


def test_longest_streak():
    days = [D(2026, 10, d) for d in (1, 2, 3, 7, 8, 8, 20)]
    assert longest_streak(days) == 3
    assert longest_streak([]) == 0
