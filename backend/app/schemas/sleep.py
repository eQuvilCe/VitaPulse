from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SleepUpsert(BaseModel):
    day: date
    minutes: int = Field(ge=0, le=24 * 60)
    quality: int = Field(default=3, ge=1, le=5)


class SleepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: date
    minutes: int
    quality: int
