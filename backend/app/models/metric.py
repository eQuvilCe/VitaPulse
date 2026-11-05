from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class DailyMetric(Base):
    """One value per user, kind and day (water_ml, steps, weight_kg, mood)."""

    __tablename__ = "daily_metrics"
    __table_args__ = (UniqueConstraint("user_id", "kind", "day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20), index=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    value: Mapped[float] = mapped_column(Float)
