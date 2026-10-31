from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Reminder
from app.schemas.reminder import ReminderCreate, ReminderRead

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
