from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.models import Meal
from app.schemas.meal import DayTotals, MealIn, MealRead

router = APIRouter(prefix="/meals", tags=["meals"])


def _owned_meal(db: DbSession, meal_id: int, user_id: int) -> Meal:
    meal = db.get(Meal, meal_id)
    if meal is None or meal.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")
    return meal


@router.post("", response_model=MealRead, status_code=status.HTTP_201_CREATED)
def create_meal(data: MealIn, user: CurrentUser, db: DbSession) -> Meal:
    meal = Meal(user_id=user.id, **data.model_dump())
    db.add(meal)
    db.commit()
    return meal


@router.get("", response_model=list[MealRead])
def list_meals(day: date, user: CurrentUser, db: DbSession) -> list[Meal]:
    stmt = select(Meal).where(Meal.user_id == user.id, Meal.day == day).order_by(Meal.id)
    return list(db.scalars(stmt))


@router.get("/totals", response_model=list[DayTotals])
def meal_totals(start: date, end: date, user: CurrentUser, db: DbSession) -> list[DayTotals]:
    stmt = (
        select(
            Meal.day,
            func.sum(Meal.calories),
            func.sum(Meal.protein_g),
            func.sum(Meal.carbs_g),
            func.sum(Meal.fat_g),
        )
        .where(Meal.user_id == user.id, Meal.day >= start, Meal.day <= end)
        .group_by(Meal.day)
        .order_by(Meal.day)
    )
    return [
        DayTotals(day=d, calories=c, protein_g=p, carbs_g=cb, fat_g=f)
        for d, c, p, cb, f in db.execute(stmt)
    ]


@router.put("/{meal_id}", response_model=MealRead)
def update_meal(meal_id: int, data: MealIn, user: CurrentUser, db: DbSession) -> Meal:
    meal = _owned_meal(db, meal_id, user.id)
    for key, value in data.model_dump().items():
        setattr(meal, key, value)
    db.commit()
    return meal


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, user: CurrentUser, db: DbSession) -> None:
    db.delete(_owned_meal(db, meal_id, user.id))
    db.commit()
