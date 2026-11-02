from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Goal
from app.schemas.goal import GoalRead, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


def get_or_create_goal(db: DbSession, user_id: int) -> Goal:
    goal = db.scalar(select(Goal).where(Goal.user_id == user_id))
    if goal is None:
        goal = Goal(user_id=user_id)
        db.add(goal)
        db.commit()
    return goal


@router.get("", response_model=GoalRead)
def read_goals(user: CurrentUser, db: DbSession) -> Goal:
    return get_or_create_goal(db, user.id)


@router.patch("", response_model=GoalRead)
def update_goals(data: GoalUpdate, user: CurrentUser, db: DbSession) -> Goal:
    goal = get_or_create_goal(db, user.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    db.commit()
    return goal
