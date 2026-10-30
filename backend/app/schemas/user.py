from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Language = Literal["ru", "uz", "en"]
Sex = Literal["male", "female"]
Activity = Literal["sedentary", "light", "moderate", "active"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=100)
    language: Language = "en"


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    language: Language | None = None
    height_cm: float | None = Field(default=None, gt=50, lt=260)
    birth_year: int | None = Field(default=None, ge=1900, le=2100)
    sex: Sex | None = None
    activity: Activity | None = None

    @field_validator("birth_year")
    @classmethod
    def birth_year_not_in_future(cls, value: int | None) -> int | None:
        if value is not None and value > date.today().year:
            raise ValueError("birth_year cannot be in the future")
        return value


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    language: Language
    height_cm: float | None = None
    birth_year: int | None = None
    sex: Sex | None = None
    activity: Activity = "light"
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
