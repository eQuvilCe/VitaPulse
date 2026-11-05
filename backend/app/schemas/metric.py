from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.dates import is_future

MetricKind = Literal["water_ml", "steps", "weight_kg", "mood"]

# Upper bounds that catch typos without rejecting real-world values.
MAX_VALUES: dict[str, float] = {"water_ml": 20000, "steps": 200000, "weight_kg": 500, "mood": 5}


class _DayIn(BaseModel):
    day: date

    @field_validator("day")
    @classmethod
    def day_not_in_future(cls, value: date) -> date:
        if is_future(value):
            raise ValueError("day cannot be in the future")
        return value


class MetricSet(_DayIn):
    value: float = Field(gt=0)


class MetricAdd(_DayIn):
    delta: float = Field(gt=0)


class MetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: MetricKind
    day: date
    value: float
