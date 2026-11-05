from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.dates import is_future


class SleepIn(BaseModel):
    day: date
    minutes: int = Field(gt=0, le=24 * 60)
    quality: int = Field(default=3, ge=1, le=5)

    @field_validator("day")
    @classmethod
    def day_not_in_future(cls, value: date) -> date:
        if is_future(value):
            raise ValueError("day cannot be in the future")
        return value


class SleepRead(SleepIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
