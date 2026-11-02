from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class HabitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    archived: bool


class HabitStatus(HabitRead):
    done_today: bool
    current_streak: int
    longest_streak: int


class CheckinIn(BaseModel):
    day: date
