from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Goal(Base):
    """Daily targets for one user; defaults match the coach reference values."""

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    sleep_minutes: Mapped[int] = mapped_column(Integer, default=7 * 60)
    water_ml: Mapped[int] = mapped_column(Integer, default=2000)
    steps: Mapped[int] = mapped_column(Integer, default=8000)
    calories: Mapped[int] = mapped_column(Integer, default=2200)
