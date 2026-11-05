from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.meal import MealRead, MealType
from app.schemas.plan import PlanLanguage, Unit

SwapGoal = Literal["lower_kcal", "more_protein", "less_sugar", "less_fat"]


class CookIngredient(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    amount: float | None = Field(default=None, ge=0, le=100000)
    unit: Unit | None = None
    have: bool = False


class CookStep(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    timer_sec: int | None = Field(default=None, ge=1, le=6 * 3600)


class CookRecipe(BaseModel):
    key: str = Field(min_length=1, max_length=60)
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=400)
    meal_type: MealType | None = None
    time_min: int = Field(ge=1, le=600)
    servings: int = Field(default=1, ge=1, le=12)
    calories: int = Field(ge=0, le=5000)
    protein_g: float = Field(ge=0, le=500)
    fat_g: float = Field(ge=0, le=500)
    carbs_g: float = Field(ge=0, le=1000)
    ingredients: list[CookIngredient] = Field(max_length=40)
    missing: list[str] = Field(default_factory=list, max_length=40)
    steps: list[CookStep] = Field(max_length=30)
    tags: list[str] = Field(default_factory=list, max_length=10)


class SuggestIn(BaseModel):
    ingredients: list[str] = Field(min_length=1, max_length=30)
    kcal: int | None = Field(default=None, ge=100, le=2000)
    time_min: int | None = Field(default=None, ge=5, le=300)
    meal_type: MealType | None = None
    restrictions: list[str] | None = Field(default=None, max_length=10)
    servings: int = Field(default=1, ge=1, le=6)
    language: PlanLanguage | None = None


class SuggestRead(BaseModel):
    source: Literal["ai", "template"]
    kcal_target: int
    recipes: list[CookRecipe]


class SwapIn(BaseModel):
    dish: str = Field(min_length=1, max_length=120)
    ingredients: list[str] = Field(default_factory=list, max_length=30)
    goal: SwapGoal = "lower_kcal"
    language: PlanLanguage | None = None


class Swap(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from", serialization_alias="from")
    to: str
    why: str
    kcal_saved: int


class SwapRead(BaseModel):
    source: Literal["ai", "template"]
    dish: str
    swaps: list[Swap]
    tips: list[str]
    kcal_saved_total: int


class FavoriteIn(BaseModel):
    recipe: CookRecipe
    note: str = Field(default="", max_length=300)


class FavoritePatch(BaseModel):
    note: str = Field(max_length=300)


class FavoriteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipe: CookRecipe
    note: str
    created_at: datetime


class CookDiaryIn(BaseModel):
    recipe: CookRecipe
    servings_eaten: float = Field(default=1, ge=0.25, le=6)
    day: date | None = None
    meal_type: MealType | None = None


class CookDiaryRead(BaseModel):
    meal: MealRead
    new_achievements: list[str]


class RecipeIn(BaseModel):
    recipe: CookRecipe


class ShoppingIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    amount: float | None = Field(default=None, ge=0, le=100000)
    unit: str | None = Field(default=None, max_length=10)


class ShoppingAdd(BaseModel):
    items: list[ShoppingIn] = Field(min_length=1, max_length=50)


class ShoppingPatch(BaseModel):
    checked: bool | None = None
    name: str | None = Field(default=None, min_length=1, max_length=120)
    amount: float | None = Field(default=None, ge=0, le=100000)
    unit: str | None = Field(default=None, max_length=10)


class ShoppingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    amount: float | None
    unit: str | None
    checked: bool
    source: Literal["manual", "cook", "plan"]
    created_at: datetime


# --- what the AI is asked to return


class AICookRecipe(BaseModel):
    name: str
    description: str
    meal_type: MealType
    time_min: int
    calories: int
    protein_g: float
    fat_g: float
    carbs_g: float
    ingredients: list[CookIngredient]
    steps: list[CookStep]
    tags: list[str]


class AICook(BaseModel):
    recipes: list[AICookRecipe]


class AISwap(BaseModel):
    original: str
    replacement: str
    why: str
    kcal_saved: int


class AISwaps(BaseModel):
    swaps: list[AISwap]
    tips: list[str]
