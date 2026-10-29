from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MealIn(BaseModel):
    day: date
    name: str = Field(min_length=1, max_length=120)
    calories: int = Field(ge=0, le=10000)
    protein_g: float = Field(default=0, ge=0, le=1000)
    carbs_g: float = Field(default=0, ge=0, le=1000)
    fat_g: float = Field(default=0, ge=0, le=1000)


class MealRead(MealIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DayTotals(BaseModel):
    day: date
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
