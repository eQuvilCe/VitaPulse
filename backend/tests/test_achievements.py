from datetime import date, timedelta

from app.services.achievements import Activity, unlocked_badges


def run(length: int, start: date = date(2026, 10, 1)) -> list[date]:
    return [start + timedelta(days=i) for i in range(length)]


def test_no_activity_unlocks_nothing():
    assert unlocked_badges(Activity()) == []


def test_single_meal_unlocks_first_meal():
    assert unlocked_badges(Activity(meal_days=run(1))) == ["first_meal"]


def test_streak_badges_use_best_run():
    badges = unlocked_badges(Activity(steps_goal_days=run(7)))
    assert badges == ["steps_3", "steps_7"]


def test_broken_run_does_not_count():
    days = run(3) + run(3, date(2026, 10, 10))
    assert unlocked_badges(Activity(water_goal_days=days)) == ["water_3"]


def test_habit_month():
    assert "habits_30" in unlocked_badges(Activity(habit_days=run(30)))
