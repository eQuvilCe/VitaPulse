from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import SleepLog
from app.schemas.sleep import SleepIn, SleepRead

router = APIRouter(prefix="/sleep", tags=["sleep"])


@router.put("", response_model=SleepRead)
def upsert_sleep(data: SleepIn, user: CurrentUser, db: DbSession) -> SleepLog:
    """One entry per day: logging the same day again replaces it."""
    log = db.scalar(select(SleepLog).where(SleepLog.user_id == user.id, SleepLog.day == data.day))
    if log is None:
        log = SleepLog(user_id=user.id, day=data.day)
        db.add(log)
    log.minutes = data.minutes
    log.quality = data.quality
    db.commit()
    return log


@router.get("", response_model=list[SleepRead])
def list_sleep(
    user: CurrentUser,
    db: DbSession,
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=90, ge=1, le=365),
) -> list[SleepLog]:
    stmt = select(SleepLog).where(SleepLog.user_id == user.id)
    if start:
        stmt = stmt.where(SleepLog.day >= start)
    if end:
        stmt = stmt.where(SleepLog.day <= end)
    return list(db.scalars(stmt.order_by(SleepLog.day.desc()).limit(limit)))


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep(log_id: int, user: CurrentUser, db: DbSession) -> None:
    log = db.get(SleepLog, log_id)
    if log is None or log.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sleep entry not found")
    db.delete(log)
    db.commit()
