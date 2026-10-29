from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import WaterLog
from app.schemas.water import WaterCreate, WaterDay, WaterRead

router = APIRouter(prefix="/water", tags=["water"])


@router.post("", response_model=WaterRead, status_code=status.HTTP_201_CREATED)
def add_water(body: WaterCreate, db: DbSession, user: CurrentUser) -> WaterLog:
    entry = WaterLog(user_id=user.id, **body.model_dump())
    db.add(entry)
    db.commit()
    return entry


@router.get("/{day}", response_model=WaterDay)
def water_for_day(day: date, db: DbSession, user: CurrentUser) -> WaterDay:
    entries = list(
        db.scalars(
            select(WaterLog)
            .where(WaterLog.user_id == user.id, WaterLog.day == day)
            .order_by(WaterLog.id)
        )
    )
    return WaterDay(
        day=day,
        total_ml=sum(e.ml for e in entries),
        entries=[WaterRead.model_validate(e) for e in entries],
    )


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water(entry_id: int, db: DbSession, user: CurrentUser) -> None:
    entry = db.get(WaterLog, entry_id)
    if entry is None or entry.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Water entry not found")
    db.delete(entry)
    db.commit()
