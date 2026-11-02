from datetime import date
from typing import Literal

from fastapi import APIRouter, Response

from app.api.deps import CurrentUser, DbSession
from app.services.export import daily_rows, to_csv

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/daily")
def export_daily(
    user: CurrentUser,
    db: DbSession,
    fmt: Literal["json", "csv"] = "json",
    start: date | None = None,
    end: date | None = None,
):
    """All logged data merged per day, as JSON or a CSV download."""
    rows = daily_rows(db, user.id, start, end)
    if fmt == "csv":
        return Response(
            to_csv(rows),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="vitapulse.csv"'},
        )
    return rows
