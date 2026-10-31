import uuid
from datetime import date, timedelta
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.config import settings
from app.models import DailyMetric, Measurement, Plan, ProgressPhoto, Workout
from app.schemas.progress import (
    MeasurementIn,
    MeasurementRead,
    PhotoKind,
    PhotoRead,
    ProgressSummary,
    WorkoutCreated,
    WorkoutIn,
    WorkoutRead,
)
from app.services import achievements, uploads, userdata

router = APIRouter(prefix="/progress", tags=["progress"])

PHOTO_MAX_BYTES = 8 * 2**20
PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _owned(db: DbSession, model, row_id: int, user_id: int):
    row = db.get(model, row_id)
    if row is None or row.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return row


def _range(stmt, column, start: date | None, end: date | None):
    if start:
        stmt = stmt.where(column >= start)
    if end:
        stmt = stmt.where(column <= end)
    return stmt


# --- measurements


@router.put("/measurements", response_model=MeasurementRead)
def set_measurement(data: MeasurementIn, user: CurrentUser, db: DbSession) -> Measurement:
    row = db.scalar(
        select(Measurement).where(Measurement.user_id == user.id, Measurement.day == data.day)
    )
    if row is None:
        row = Measurement(user_id=user.id, day=data.day)
        db.add(row)
    for key, value in data.model_dump(exclude={"day"}, exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    return row


@router.get("/measurements", response_model=list[MeasurementRead])
def list_measurements(
    user: CurrentUser, db: DbSession, start: date | None = None, end: date | None = None
) -> list[Measurement]:
    stmt = _range(
        select(Measurement).where(Measurement.user_id == user.id), Measurement.day, start, end
    )
    return list(db.scalars(stmt.order_by(Measurement.day)))


@router.delete("/measurements/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(row_id: int, user: CurrentUser, db: DbSession) -> None:
    db.delete(_owned(db, Measurement, row_id, user.id))
    db.commit()


# --- photos


def _photo_dir(user_id: int) -> Path:
    return Path(settings.media_dir) / "photos" / str(user_id)


def _photo_read(photo: ProgressPhoto) -> PhotoRead:
    return PhotoRead.model_validate(
        {
            **{
                c: getattr(photo, c)
                for c in ("id", "day", "kind", "note", "content_type", "created_at")
            },
            "url": f"/api/v1/progress/photos/{photo.id}/file",
        }
    )


@router.post("/photos", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    user: CurrentUser,
    db: DbSession,
    image: Annotated[UploadFile, File()],
    day: Annotated[date | None, Form()] = None,
    kind: Annotated[PhotoKind, Form()] = "progress",
    note: Annotated[str, Form(max_length=200)] = "",
) -> PhotoRead:
    data, media_type, ext = await uploads.read_image(image, PHOTO_MAX_BYTES, PHOTO_TYPES)
    folder = _photo_dir(user.id)
    folder.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    (folder / filename).write_bytes(data)
    photo = ProgressPhoto(
        user_id=user.id,
        day=day or date.today(),
        kind=kind,
        note=note,
        content_type=media_type,
        filename=filename,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return _photo_read(photo)


@router.get("/photos", response_model=list[PhotoRead])
def list_photos(user: CurrentUser, db: DbSession) -> list[PhotoRead]:
    rows = db.scalars(
        select(ProgressPhoto)
        .where(ProgressPhoto.user_id == user.id)
        .order_by(ProgressPhoto.day, ProgressPhoto.id)
    )
    return [_photo_read(p) for p in rows]


@router.get("/photos/{photo_id}/file")
def photo_file(photo_id: int, user: CurrentUser, db: DbSession) -> FileResponse:
    photo = _owned(db, ProgressPhoto, photo_id, user.id)
    path = _photo_dir(user.id) / photo.filename
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return FileResponse(
        path,
        media_type=photo.content_type,
        headers={"Cache-Control": "private, no-store"},
    )


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(photo_id: int, user: CurrentUser, db: DbSession) -> None:
    photo = _owned(db, ProgressPhoto, photo_id, user.id)
    (_photo_dir(user.id) / photo.filename).unlink(missing_ok=True)
    db.delete(photo)
    db.commit()


# --- workouts


@router.post("/workouts", response_model=WorkoutCreated, status_code=status.HTTP_201_CREATED)
def log_workout(data: WorkoutIn, user: CurrentUser, db: DbSession) -> WorkoutCreated:
    workout = Workout(user_id=user.id, **{**data.model_dump(), "day": data.day or date.today()})
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return WorkoutCreated(
        workout=WorkoutRead.model_validate(workout),
        new_achievements=achievements.evaluate(db, user.id),
    )


@router.get("/workouts", response_model=list[WorkoutRead])
def list_workouts(
    user: CurrentUser, db: DbSession, start: date | None = None, end: date | None = None
) -> list[Workout]:
    stmt = _range(select(Workout).where(Workout.user_id == user.id), Workout.day, start, end)
    return list(db.scalars(stmt.order_by(Workout.day.desc(), Workout.id.desc())))


@router.delete("/workouts/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(row_id: int, user: CurrentUser, db: DbSession) -> None:
    db.delete(_owned(db, Workout, row_id, user.id))
    db.commit()


# --- summary


@router.get("/summary", response_model=ProgressSummary)
def summary(user: CurrentUser, db: DbSession) -> ProgressSummary:
    plan = userdata.active_plan(db, user.id)
    first_plan = db.scalar(select(Plan).where(Plan.user_id == user.id).order_by(Plan.id).limit(1))
    first_weight = db.scalar(
        select(DailyMetric.value)
        .where(DailyMetric.user_id == user.id, DailyMetric.kind == "weight_kg")
        .order_by(DailyMetric.day)
        .limit(1)
    )
    start = first_plan.input["weight_kg"] if first_plan else first_weight
    current = userdata.latest_weight(db, user.id)
    target = None
    if plan and plan.input["goal"] != "maintain":
        target = plan.data["forecast"]["target_weight_kg"]
    percent = None
    if start is not None and current is not None and target is not None and target != start:
        percent = round(max(0, min(1, (current - start) / (target - start))) * 100)
    week_start = date.today() - timedelta(days=date.today().weekday())
    return ProgressSummary(
        start_weight_kg=start,
        current_weight_kg=current,
        change_kg=round(current - start, 1) if start is not None and current is not None else None,
        target_weight_kg=target,
        goal_progress_percent=percent,
        workouts_total=db.scalar(select(func.count()).where(Workout.user_id == user.id)),
        workouts_this_week=db.scalar(
            select(func.count()).where(Workout.user_id == user.id, Workout.day >= week_start)
        ),
        latest_measurement=db.scalar(
            select(Measurement)
            .where(Measurement.user_id == user.id)
            .order_by(Measurement.day.desc())
            .limit(1)
        ),
        photos_total=db.scalar(select(func.count()).where(ProgressPhoto.user_id == user.id)),
    )
