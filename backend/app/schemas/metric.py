from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MetricKind = Literal["water_ml", "steps", "weight_kg", "mood"]

# Upper bounds that catch typos without rejecting real-world values.
MAX_VALUES: dict[str, float] = {"water_ml": 20000, "steps": 200000, "weight_kg": 500, "mood": 5}


class MetricSet(BaseModel):
    day: date
    value: float = Field(gt=0)


class MetricAdd(BaseModel):
    day: date
    delta: float = Field(gt=0)


class MetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: MetricKind
    day: date
    value: float
