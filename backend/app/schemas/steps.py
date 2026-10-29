from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class StepsUpsert(BaseModel):
    day: date
    steps: int = Field(ge=0, le=200_000)


class StepsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: date
    steps: int
