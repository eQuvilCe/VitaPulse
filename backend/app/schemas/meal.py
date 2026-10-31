from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MealType = Literal["breakfast", "lunch", "dinner", "snack"]
MealSource = Literal["manual", "scan", "plan", "cook"]


class MealIn(BaseModel):
    day: date
    name: str = Field(min_length=1, max_length=120)
    calories: int = Field(ge=0, le=10000)
    protein_g: float = Field(default=0, ge=0, le=1000)
    carbs_g: float = Field(default=0, ge=0, le=1000)
    fat_g: float = Field(default=0, ge=0, le=1000)
    meal_type: MealType | None = None
    source: MealSource = "manual"


class MealRead(MealIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DayTotals(BaseModel):
    day: date
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float


class Nutrients(BaseModel):
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float


class DiaryRead(BaseModel):
    day: date
    meals: list[MealRead]
    totals: Nutrients
    targets: Nutrients
    remaining: Nutrients
    percent: Nutrients
    water_ml: float
    water_target_ml: int
    targets_source: Literal["plan", "goals"]


class ScanItem(BaseModel):
    name: str
    calories: int
    grams: int


class ScanResult(BaseModel):
    """What the vision model returns for a photo of a plate."""

    dish: str
    calories: int
    protein_g: float
    fat_g: float
    carbs_g: float
    portion_g: int
    confidence: float
    items: list[ScanItem]


class ScanRead(ScanResult):
    source: Literal["ai", "template"]
    meal: MealRead | None = None
    new_achievements: list[str] = []
