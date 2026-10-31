from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

PhotoKind = Literal["before", "after", "progress"]
WorkoutKind = Literal["fat_loss", "strength", "cardio", "other"]


class MeasurementIn(BaseModel):
    day: date
    waist_cm: float | None = Field(default=None, ge=20, le=300)
    hips_cm: float | None = Field(default=None, ge=20, le=300)
    chest_cm: float | None = Field(default=None, ge=20, le=300)

    @model_validator(mode="after")
    def at_least_one(self) -> "MeasurementIn":
        if self.waist_cm is None and self.hips_cm is None and self.chest_cm is None:
            raise ValueError("give at least one of waist_cm, hips_cm, chest_cm")
        return self


class MeasurementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: date
    waist_cm: float | None
    hips_cm: float | None
    chest_cm: float | None


class PhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: date
    kind: PhotoKind
    note: str
    content_type: str
    created_at: datetime
    url: str


class WorkoutIn(BaseModel):
    day: date | None = None
    title: str = Field(min_length=1, max_length=120)
    kind: WorkoutKind = "other"
    duration_min: int | None = Field(default=None, ge=1, le=600)
    plan_day: int | None = Field(default=None, ge=1, le=7)
    note: str = Field(default="", max_length=300)


class WorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: date
    title: str
    kind: WorkoutKind
    duration_min: int | None
    plan_day: int | None
    note: str
    created_at: datetime


class WorkoutCreated(BaseModel):
    workout: WorkoutRead
    new_achievements: list[str]


class ProgressSummary(BaseModel):
    start_weight_kg: float | None
    current_weight_kg: float | None
    change_kg: float | None
    target_weight_kg: float | None
    goal_progress_percent: int | None
    workouts_total: int
    workouts_this_week: int
    latest_measurement: MeasurementRead | None
    photos_total: int
