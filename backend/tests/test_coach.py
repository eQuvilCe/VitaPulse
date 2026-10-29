from app.services.coach import DaySnapshot, build_tips


def test_nothing_logged_asks_for_sleep_water_and_steps():
    assert build_tips(DaySnapshot()) == ["log_sleep", "drink_water", "walk_more"]


def test_short_sleep_gets_a_tip():
    s = DaySnapshot(sleep_minutes=300, water_ml=2000, steps=9000)
    assert build_tips(s) == ["sleep_more"]


def test_unfinished_habits_are_flagged():
    s = DaySnapshot(sleep_minutes=480, water_ml=2000, steps=9000, habits_done=1, habits_total=3)
    assert build_tips(s) == ["finish_habits"]


def test_all_good():
    s = DaySnapshot(sleep_minutes=480, water_ml=2500, steps=10000, habits_done=2, habits_total=2)
    assert build_tips(s) == ["keep_going"]
