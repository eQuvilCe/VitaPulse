from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Language = Literal["ru", "uz", "en"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=100)
    language: Language = "en"


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    language: Language | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    language: Language
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
