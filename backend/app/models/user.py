from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # Empty for accounts created through Google until a password is set.
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    google_sub: Mapped[str | None] = mapped_column(String(64), unique=True, default=None)
    name: Mapped[str] = mapped_column(String(100), default="")
    language: Mapped[str] = mapped_column(String(5), default="en")
    height_cm: Mapped[float | None] = mapped_column(Float, default=None)
    birth_year: Mapped[int | None] = mapped_column(Integer, default=None)
    sex: Mapped[str | None] = mapped_column(String(10), default=None)
    activity: Mapped[str] = mapped_column(String(10), default="light")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def has_password(self) -> bool:
        return bool(self.password_hash)

    @property
    def google_linked(self) -> bool:
        return self.google_sub is not None
