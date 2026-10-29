from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import StepsLog
from app.schemas.steps import StepsRead, StepsUpsert

router = APIRouter(prefix="/steps", tags=["steps"])


@router.put("", response_model=StepsRead)
def upsert_steps(body: StepsUpsert, db: DbSession, user: CurrentUser) -> StepsLog:
    log = db.scalar(select(StepsLog).where(StepsLog.user_id == user.id, StepsLog.day == body.day))
    if log is None:
        log = StepsLog(user_id=user.id, **body.model_dump())
        db.add(log)
    else:
        log.steps = body.steps
    db.commit()
    return log


@router.get("", response_model=list[StepsRead])
def list_steps(
    db: DbSession,
    user: CurrentUser,
    start: Annotated[date | None, Query(alias="from")] = None,
    end: Annotated[date | None, Query(alias="to")] = None,
    limit: Annotated[int, Query(ge=1, le=1000)] = 100,
) -> list[StepsLog]:
    stmt = select(StepsLog).where(StepsLog.user_id == user.id).order_by(StepsLog.day.desc())
    if start:
        stmt = stmt.where(StepsLog.day >= start)
    if end:
        stmt = stmt.where(StepsLog.day <= end)
    return list(db.scalars(stmt.limit(limit)))
