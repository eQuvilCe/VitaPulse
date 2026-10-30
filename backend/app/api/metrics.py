from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import DailyMetric
from app.schemas.metric import MAX_VALUES, MetricAdd, MetricKind, MetricRead, MetricSet

router = APIRouter(prefix="/metrics", tags=["metrics"])


def _get(db: DbSession, user_id: int, kind: str, day: date) -> DailyMetric | None:
    return db.scalar(
        select(DailyMetric).where(
            DailyMetric.user_id == user_id, DailyMetric.kind == kind, DailyMetric.day == day
        )
    )


def _check_max(kind: str, value: float) -> None:
    if value > MAX_VALUES[kind]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"{kind} is out of range")


@router.put("/{kind}", response_model=MetricRead)
def set_metric(kind: MetricKind, data: MetricSet, user: CurrentUser, db: DbSession) -> DailyMetric:
    _check_max(kind, data.value)
    row = _get(db, user.id, kind, data.day)
    if row is None:
        row = DailyMetric(user_id=user.id, kind=kind, day=data.day)
        db.add(row)
    row.value = data.value
    db.commit()
    return row


@router.post("/{kind}/add", response_model=MetricRead)
def add_to_metric(
    kind: MetricKind, data: MetricAdd, user: CurrentUser, db: DbSession
) -> DailyMetric:
    """Increment a running total, e.g. one more glass of water."""
    row = _get(db, user.id, kind, data.day)
    total = (row.value if row else 0) + data.delta
    _check_max(kind, total)
    if row is None:
        row = DailyMetric(user_id=user.id, kind=kind, day=data.day)
        db.add(row)
    row.value = total
    db.commit()
    return row


@router.get("/{kind}", response_model=list[MetricRead])
def list_metric(
    kind: MetricKind,
    user: CurrentUser,
    db: DbSession,
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=90, ge=1, le=365),
) -> list[DailyMetric]:
    stmt = select(DailyMetric).where(DailyMetric.user_id == user.id, DailyMetric.kind == kind)
    if start:
        stmt = stmt.where(DailyMetric.day >= start)
    if end:
        stmt = stmt.where(DailyMetric.day <= end)
    return list(db.scalars(stmt.order_by(DailyMetric.day.desc()).limit(limit)))
