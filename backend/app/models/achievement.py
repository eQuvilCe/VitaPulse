from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(20))
    # False until the user has fetched it once, which drives the "new" badge.
    seen: Mapped[bool] = mapped_column(Boolean, default=False)
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
