from datetime import date

from pydantic import BaseModel

from app.schemas.goal import GoalRead


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
    tips: list[str]
