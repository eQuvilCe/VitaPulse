from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SleepIn(BaseModel):
    day: date
    minutes: int = Field(gt=0, le=24 * 60)
    quality: int = Field(default=3, ge=1, le=5)


class SleepRead(SleepIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
