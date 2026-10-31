from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Habit, HabitCheckin
from app.schemas.habit import CheckinIn, HabitCreate, HabitRead, HabitStatus
from app.services.streaks import current_streak, longest_streak

router = APIRouter(prefix="/habits", tags=["habits"])


def _owned_habit(db: DbSession, habit_id: int, user_id: int) -> Habit:
    habit = db.get(Habit, habit_id)
    if habit is None or habit.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Habit not found")
    return habit


def _checkin_days(db: DbSession, habit_id: int) -> list[date]:
    return list(db.scalars(select(HabitCheckin.day).where(HabitCheckin.habit_id == habit_id)))


@router.post("", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(data: HabitCreate, user: CurrentUser, db: DbSession) -> Habit:
    habit = Habit(user_id=user.id, name=data.name)
    db.add(habit)
    db.commit()
    return habit


@router.get("", response_model=list[HabitStatus])
def list_habits(user: CurrentUser, db: DbSession, today: date | None = None) -> list[HabitStatus]:
    today = today or date.today()
    habits = db.scalars(
        select(Habit).where(Habit.user_id == user.id, Habit.archived.is_(False)).order_by(Habit.id)
    )
    result = []
    for habit in habits:
        days = _checkin_days(db, habit.id)
        result.append(
            HabitStatus(
                **HabitRead.model_validate(habit).model_dump(),
                done_today=today in days,
                current_streak=current_streak(days, today),
                longest_streak=longest_streak(days),
            )
        )
    return result


@router.post("/{habit_id}/checkins", status_code=status.HTTP_204_NO_CONTENT)
def check_in(habit_id: int, data: CheckinIn, user: CurrentUser, db: DbSession) -> None:
    habit = _owned_habit(db, habit_id, user.id)
    if data.day not in _checkin_days(db, habit.id):
        db.add(HabitCheckin(habit_id=habit.id, day=data.day))
        db.commit()


@router.delete("/{habit_id}/checkins/{day}", status_code=status.HTTP_204_NO_CONTENT)
def undo_check_in(habit_id: int, day: date, user: CurrentUser, db: DbSession) -> None:
    habit = _owned_habit(db, habit_id, user.id)
    row = db.scalar(
        select(HabitCheckin).where(HabitCheckin.habit_id == habit.id, HabitCheckin.day == day)
    )
    if row:
        db.delete(row)
        db.commit()


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_habit(habit_id: int, user: CurrentUser, db: DbSession) -> None:
    _owned_habit(db, habit_id, user.id).archived = True
    db.commit()
