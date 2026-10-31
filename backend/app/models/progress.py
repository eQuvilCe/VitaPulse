from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Measurement(Base):
    __tablename__ = "measurements"
    __table_args__ = (UniqueConstraint("user_id", "day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    waist_cm: Mapped[float | None] = mapped_column(Float, default=None)
    hips_cm: Mapped[float | None] = mapped_column(Float, default=None)
    chest_cm: Mapped[float | None] = mapped_column(Float, default=None)


class ProgressPhoto(Base):
    """Metadata for a private photo; the file sits under settings.media_dir."""

    __tablename__ = "progress_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date)
    kind: Mapped[str] = mapped_column(String(10), default="progress")
    note: Mapped[str] = mapped_column(String(200), default="")
    content_type: Mapped[str] = mapped_column(String(30))
    filename: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    title: Mapped[str] = mapped_column(String(120))
    kind: Mapped[str] = mapped_column(String(10), default="other")
    duration_min: Mapped[int | None] = mapped_column(Integer, default=None)
    plan_day: Mapped[int | None] = mapped_column(Integer, default=None)
    note: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
