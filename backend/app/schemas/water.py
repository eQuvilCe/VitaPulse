from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class WaterCreate(BaseModel):
    day: date
    ml: int = Field(gt=0, le=5000)


class WaterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: date
    ml: int


class WaterDay(BaseModel):
    day: date
    total_ml: int
    entries: list[WaterRead]
