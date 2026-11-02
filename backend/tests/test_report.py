from datetime import date

from app.services.report import DayRow, Goals, best_steps_day, goal_hits

GOALS = Goals(sleep=420, water=2000, steps=8000)


def rows():
    return [
        DayRow(date(2026, 10, 1), 450, 2500, 9000),
        DayRow(date(2026, 10, 2), 300, 1000, 12000),
        DayRow(date(2026, 10, 3), None, 0, 0),
    ]


def test_goal_hits_counts_each_area():
    assert goal_hits(rows(), GOALS) == {"sleep": 1, "water": 1, "steps": 2}


def test_best_steps_day():
    assert best_steps_day(rows()) == date(2026, 10, 2)


def test_best_steps_day_none_when_no_steps():
    assert best_steps_day([DayRow(date(2026, 10, 1), None, 0, 0)]) is None
    assert best_steps_day([]) is None
