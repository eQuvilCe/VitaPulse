from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import WaterLog
from app.schemas.water import WaterCreate, WaterDay, WaterRead

router = APIRouter(prefix="/water", tags=["water"])

DayParam = Annotated[date | None, Query()]


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, datetime.min.time(), tzinfo=UTC)
    return start, start + timedelta(days=1)


@router.post("", response_model=WaterRead, status_code=status.HTTP_201_CREATED)
def add_water(data: WaterCreate, user: CurrentUser, db: DbSession) -> WaterLog:
    log = WaterLog(user_id=user.id, amount_ml=data.amount_ml)
    if data.logged_at is not None:
        log.logged_at = data.logged_at
    else:
        log.logged_at = datetime.now(UTC)
    db.add(log)
    db.commit()
    return log


@router.get("", response_model=list[WaterRead])
def list_water(user: CurrentUser, db: DbSession, day: DayParam = None) -> list[WaterLog]:
    day = day or datetime.now(UTC).date()
    start, end = _day_bounds(day)
    stmt = (
        select(WaterLog)
        .where(WaterLog.user_id == user.id, WaterLog.logged_at >= start, WaterLog.logged_at < end)
        .order_by(WaterLog.logged_at)
    )
    return list(db.scalars(stmt))


@router.get("/summary", response_model=WaterDay)
def water_summary(user: CurrentUser, db: DbSession, day: DayParam = None) -> WaterDay:
    day = day or datetime.now(UTC).date()
    return WaterDay(day=day, total_ml=sum(w.amount_ml for w in list_water(user, db, day)))


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water(log_id: int, user: CurrentUser, db: DbSession) -> None:
    log = db.get(WaterLog, log_id)
    if log is None or log.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entry not found")
    db.delete(log)
    db.commit()
