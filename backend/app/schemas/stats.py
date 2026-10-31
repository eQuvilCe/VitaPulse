from datetime import date

from pydantic import BaseModel


class DayStats(BaseModel):
    day: date
    sleep_minutes: int | None
    water_ml: float
    steps: float
    weight_kg: float | None
    mood: float | None
    calories: int


class WeekRead(BaseModel):
    days: list[DayStats]
    avg_sleep_minutes: float | None
    avg_steps: float


class WeightPoint(BaseModel):
    day: date
    weight_kg: float


class WeightTrend(BaseModel):
    points: list[WeightPoint]
    latest_kg: float | None
    change_kg: float | None
