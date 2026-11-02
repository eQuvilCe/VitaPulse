from pydantic import BaseModel, ConfigDict, Field


class GoalUpdate(BaseModel):
    sleep_minutes: int | None = Field(default=None, ge=120, le=960)
    water_ml: int | None = Field(default=None, ge=250, le=10000)
    steps: int | None = Field(default=None, ge=500, le=100000)
    calories: int | None = Field(default=None, ge=800, le=10000)


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sleep_minutes: int
    water_ml: int
    steps: int
    calories: int
