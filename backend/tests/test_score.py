import pytest

from app.services.score import ScoreInput, daily_score, sleep_ratio


def make(**kw) -> ScoreInput:
    base = dict(
        sleep_minutes=480,
        sleep_goal=480,
        water_ml=2000,
        water_goal=2000,
        steps=8000,
        steps_goal=8000,
        habits_done=2,
        habits_total=2,
    )
    base.update(kw)
    return ScoreInput(**base)


def test_perfect_day_is_100():
    assert daily_score(make())["total"] == 100


def test_empty_day_only_gets_habit_points_without_habits():
    s = make(sleep_minutes=None, water_ml=0, steps=0, habits_done=0, habits_total=0)
    assert daily_score(s)["total"] == 25


def test_partial_progress_is_proportional():
    s = make(water_ml=1000, steps=4000, habits_done=1)
    scores = daily_score(s)
    assert scores["water"] == 10
    assert scores["steps"] == 13
    assert scores["habits"] == 13


def test_overshooting_goal_is_capped():
    assert daily_score(make(steps=40000))["steps"] == 25


@pytest.mark.parametrize(
    ("minutes", "expected"),
    [(None, 0.0), (240, 0.5), (480, 1.0), (600, 1.0), (840, 0.5), (1200, 0.5)],
)
def test_sleep_ratio(minutes, expected):
    assert sleep_ratio(minutes, 480) == pytest.approx(expected)
