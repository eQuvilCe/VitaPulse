from datetime import date

from pydantic import BaseModel

from app.schemas.goal import GoalRead


class ScoreRead(BaseModel):
    total: int
    sleep: int
    water: int
    steps: int
    habits: int


class DashboardRead(BaseModel):
    day: date
    sleep_minutes: int | None
    water_ml: float
    steps: float
    weight_kg: float | None
    mood: float | None
    calories: int
    habits_done: int
    habits_total: int
    goals: GoalRead
    score: ScoreRead
    tips: list[str]
