from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select, update

from app.api.deps import CurrentUser, DbSession
from app.models import UserAchievement
from app.services import achievements

router = APIRouter(prefix="/achievements", tags=["achievements"])


class AchievementRead(BaseModel):
    code: str
    unlocked: bool
    unlocked_at: datetime | None
    progress: float
    target: float


class Streaks(BaseModel):
    diary_current: int
    diary_longest: int
    workouts_total: int
    water_current: int


class AchievementsRead(BaseModel):
    achievements: list[AchievementRead]
    streaks: Streaks
    new: list[str]


@router.get("", response_model=AchievementsRead)
def list_achievements(user: CurrentUser, db: DbSession) -> AchievementsRead:
    achievements.evaluate(db, user.id)
    rows = {
        a.code: a
        for a in db.scalars(select(UserAchievement).where(UserAchievement.user_id == user.id))
    }
    progress = achievements.progress(db, user.id)
    items = []
    for code in achievements.CODES:
        value, target = progress[code]
        row = rows.get(code)
        items.append(
            AchievementRead(
                code=code,
                unlocked=row is not None,
                unlocked_at=row.unlocked_at if row else None,
                progress=target if row else round(value, 2),
                target=target,
            )
        )
    new = [code for code in achievements.CODES if code in rows and not rows[code].seen]
    if new:
        db.execute(
            update(UserAchievement)
            .where(UserAchievement.user_id == user.id, UserAchievement.code.in_(new))
            .values(seen=True)
        )
        db.commit()
    return AchievementsRead(
        achievements=items, streaks=achievements.streak_summary(db, user.id), new=new
    )
