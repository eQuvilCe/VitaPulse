from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.user import Activity, Sex

Goal = Literal["lose", "gain", "maintain"]
Location = Literal["home", "gym"]
MealType = Literal["breakfast", "lunch", "dinner", "snack"]
Unit = Literal["g", "ml", "pcs", "tbsp", "tsp"]
ShopCategory = Literal["produce", "protein", "dairy", "grains", "pantry", "other"]
PlanLanguage = Literal["en", "ru"]


class PlanInput(BaseModel):
    height_cm: float = Field(gt=100, lt=250)
    weight_kg: float = Field(gt=30, lt=300)
    age: int = Field(ge=14, le=100)
    sex: Sex
    goal: Goal
    goal_kg: float = Field(default=0, ge=0, le=50)
    target_date: date | None = None
    activity: Activity = "light"
    location: Location = "home"
    restrictions: list[str] = Field(default_factory=list, max_length=10)
    meals_per_day: int = Field(default=4, ge=3, le=5)
    language: PlanLanguage | None = None

    @field_validator("restrictions")
    @classmethod
    def clean_restrictions(cls, value: list[str]) -> list[str]:
        cleaned = [r.strip()[:60] for r in value if r.strip()]
        return list(dict.fromkeys(cleaned))

    @field_validator("target_date")
    @classmethod
    def target_in_future(cls, value: date | None) -> date | None:
        if value is not None and value <= date.today():
            raise ValueError("target_date must be in the future")
        return value


class PlanRebuild(BaseModel):
    """Any PlanInput field; missing ones keep the saved value."""

    height_cm: float | None = Field(default=None, gt=100, lt=250)
    weight_kg: float | None = Field(default=None, gt=30, lt=300)
    age: int | None = Field(default=None, ge=14, le=100)
    sex: Sex | None = None
    goal: Goal | None = None
    goal_kg: float | None = Field(default=None, ge=0, le=50)
    target_date: date | None = None
    activity: Activity | None = None
    location: Location | None = None
    restrictions: list[str] | None = Field(default=None, max_length=10)
    meals_per_day: int | None = Field(default=None, ge=3, le=5)
    language: PlanLanguage | None = None


class Nutrition(BaseModel):
    bmr: int
    tdee: int
    target_calories: int
    daily_delta: int
    protein_g: int
    fat_g: int
    carbs_g: int
    water_ml: int


class Forecast(BaseModel):
    start_weight_kg: float
    target_weight_kg: float
    weekly_change_kg: float
    weeks: float | None
    eta_date: date | None
    requested_date: date | None
    pace: Literal["safe", "fast", "capped"]
    bmi_now: float
    bmi_target: float


class Ingredient(BaseModel):
    name: str
    amount: float
    unit: Unit


class PlanMeal(BaseModel):
    type: MealType
    name: str
    calories: int
    protein_g: int
    fat_g: int
    carbs_g: int
    time_min: int
    ingredients: list[Ingredient]
    steps: list[str]


class Macros(BaseModel):
    calories: int
    protein_g: int
    fat_g: int
    carbs_g: int


class MenuDay(BaseModel):
    day: int
    meals: list[PlanMeal]
    totals: Macros


class ShoppingItem(BaseModel):
    name: str
    amount: float
    unit: Unit
    category: ShopCategory


class Exercise(BaseModel):
    name: str
    sets: int
    reps: str
    rest_sec: int
    notes: str = ""


class WorkoutDay(BaseModel):
    day: int
    title: str
    focus: str
    duration_min: int
    exercises: list[Exercise]


class WorkoutPlan(BaseModel):
    type: Literal["fat_loss", "strength"]
    location: Location
    days_per_week: int
    days: list[WorkoutDay]
    notes: list[str]


class PlanRead(BaseModel):
    id: int | None
    created_at: datetime | None
    source: Literal["ai", "template"]
    language: PlanLanguage
    input: PlanInput
    nutrition: Nutrition
    forecast: Forecast
    menu: list[MenuDay]
    shopping_list: list[ShoppingItem]
    workouts: WorkoutPlan


class PlanSummary(BaseModel):
    id: int
    created_at: datetime
    source: str
    target_calories: int
    goal: Goal
    goal_kg: float


# --- what the AI is asked to return (totals and plan metadata are filled in by us)


class AIMeal(BaseModel):
    type: MealType
    name: str
    calories: int
    protein_g: int
    fat_g: int
    carbs_g: int
    time_min: int
    ingredients: list[Ingredient]
    steps: list[str]


class AIDay(BaseModel):
    day: int
    meals: list[AIMeal]


class AIPlan(BaseModel):
    menu: list[AIDay]
    shopping_list: list[ShoppingItem]
    workout_days: list[WorkoutDay]
    workout_notes: list[str]
