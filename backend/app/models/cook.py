from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class FavoriteRecipe(Base):
    __tablename__ = "favorite_recipes"
    __table_args__ = (UniqueConstraint("user_id", "key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(60))
    recipe: Mapped[dict] = mapped_column(JSON)
    note: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    amount: Mapped[float | None] = mapped_column(Float, default=None)
    unit: Mapped[str | None] = mapped_column(String(10), default=None)
    checked: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(10), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
