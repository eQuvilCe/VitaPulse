from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import SleepLog
from app.schemas.sleep import SleepRead, SleepUpsert

router = APIRouter(prefix="/sleep", tags=["sleep"])


@router.put("", response_model=SleepRead)
def upsert_sleep(body: SleepUpsert, db: DbSession, user: CurrentUser) -> SleepLog:
    log = db.scalar(select(SleepLog).where(SleepLog.user_id == user.id, SleepLog.day == body.day))
    if log is None:
        log = SleepLog(user_id=user.id, **body.model_dump())
        db.add(log)
    else:
        log.minutes = body.minutes
        log.quality = body.quality
    db.commit()
    return log


@router.get("", response_model=list[SleepRead])
def list_sleep(
    db: DbSession,
    user: CurrentUser,
    start: Annotated[date | None, Query(alias="from")] = None,
    end: Annotated[date | None, Query(alias="to")] = None,
) -> list[SleepLog]:
    stmt = select(SleepLog).where(SleepLog.user_id == user.id).order_by(SleepLog.day.desc())
    if start:
        stmt = stmt.where(SleepLog.day >= start)
    if end:
        stmt = stmt.where(SleepLog.day <= end)
    return list(db.scalars(stmt))


@router.delete("/{day}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep(day: date, db: DbSession, user: CurrentUser) -> None:
    log = db.scalar(select(SleepLog).where(SleepLog.user_id == user.id, SleepLog.day == day))
    if log is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No sleep log for that day")
    db.delete(log)
    db.commit()
