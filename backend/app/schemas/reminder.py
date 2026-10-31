from datetime import time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ReminderKind = Literal["water", "sleep", "steps", "meal", "weight", "mood", "custom"]


def _parse_days(value: str) -> list[int]:
    return [int(d) for d in value.split(",") if d != ""]


class ReminderBase(BaseModel):
    kind: ReminderKind
    at: time
    days: list[int] = Field(default_factory=lambda: list(range(7)), min_length=1, max_length=7)
    message: str = Field(default="", max_length=200)
    enabled: bool = True

    @field_validator("days")
    @classmethod
    def _valid_days(cls, days: list[int]) -> list[int]:
        if any(d < 0 or d > 6 for d in days):
            raise ValueError("days must be weekday numbers 0 (Mon) to 6 (Sun)")
        return sorted(set(days))


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    kind: ReminderKind | None = None
    at: time | None = None
    days: list[int] | None = Field(default=None, min_length=1, max_length=7)
    message: str | None = Field(default=None, max_length=200)
    enabled: bool | None = None

    _valid_days = field_validator("days")(ReminderBase._valid_days.__func__)  # type: ignore[attr-defined]


class ReminderRead(ReminderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

    @field_validator("days", mode="before")
    @classmethod
    def _split_days(cls, value: object) -> object:
        return _parse_days(value) if isinstance(value, str) else value
