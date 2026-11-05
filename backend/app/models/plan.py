from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Plan(Base):
    """A generated personal plan; only the latest one per user is active."""

    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str] = mapped_column(String(10))
    language: Mapped[str] = mapped_column(String(5))
    # The questionnaire as sent, and the generated parts (nutrition, forecast, menu, ...).
    input: Mapped[dict] = mapped_column(JSON)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
