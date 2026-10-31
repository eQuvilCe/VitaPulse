from datetime import datetime

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Reminder
from app.schemas.reminder import ReminderCreate, ReminderRead, ReminderUpdate
from app.services.reminders import is_due

router = APIRouter(prefix="/reminders", tags=["reminders"])


def _days_to_str(days: list[int]) -> str:
    return ",".join(str(d) for d in days)


@router.post("", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(data: ReminderCreate, user: CurrentUser, db: DbSession) -> Reminder:
    reminder = Reminder(
        user_id=user.id,
        kind=data.kind,
        at=data.at,
        days=_days_to_str(data.days),
        message=data.message,
        enabled=data.enabled,
    )
    db.add(reminder)
    db.commit()
    return reminder


@router.get("", response_model=list[ReminderRead])
def list_reminders(user: CurrentUser, db: DbSession) -> list[Reminder]:
    stmt = select(Reminder).where(Reminder.user_id == user.id).order_by(Reminder.at, Reminder.id)
    return list(db.scalars(stmt))


@router.get("/due", response_model=list[ReminderRead])
def due_reminders(user: CurrentUser, db: DbSession, now: datetime | None = None) -> list[Reminder]:
    """Reminders that should fire right now. `now` is the user's local time (naive)."""
    moment = now.replace(tzinfo=None) if now else datetime.now()
    stmt = select(Reminder).where(Reminder.user_id == user.id, Reminder.enabled.is_(True))
    return [r for r in db.scalars(stmt) if is_due(r, moment)]


def _get_owned(db: DbSession, user: CurrentUser, reminder_id: int) -> Reminder:
    reminder = db.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminder not found")
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderRead)
def update_reminder(
    reminder_id: int, data: ReminderUpdate, user: CurrentUser, db: DbSession
) -> Reminder:
    reminder = _get_owned(db, user, reminder_id)
    changes = data.model_dump(exclude_unset=True)
    if "days" in changes:
        changes["days"] = _days_to_str(changes["days"])
    for field, value in changes.items():
        setattr(reminder, field, value)
    db.commit()
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: int, user: CurrentUser, db: DbSession) -> Response:
    db.delete(_get_owned(db, user, reminder_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
