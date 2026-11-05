from datetime import date, datetime

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.models import FavoriteRecipe, Meal, ShoppingItem, User
from app.schemas.cook import (
    CookDiaryIn,
    CookDiaryRead,
    FavoriteIn,
    FavoritePatch,
    FavoriteRead,
    RecipeIn,
    ShoppingAdd,
    ShoppingIn,
    ShoppingPatch,
    ShoppingRead,
    SuggestIn,
    SuggestRead,
    SwapIn,
    SwapRead,
)
from app.schemas.meal import MealRead
from app.services import achievements, cook, templates, userdata

router = APIRouter(tags=["cook"])

KCAL_RANGE = (300, 750)


def default_kcal(db: DbSession, user: User, meal_type: str | None, now: datetime) -> int:
    """A per-serving target: the plan share for the meal type, else what is left today
    spread over the meals still ahead."""
    targets, _, _ = userdata.daily_targets(db, user.id)
    if meal_type:
        share = dict(templates.MEAL_SPLITS[4]).get(meal_type, 0.3)
        kcal = targets["calories"] * share
    else:
        left = targets["calories"] - userdata.day_totals(db, user.id, now.date())["calories"]
        meals_ahead = 3 if now.hour < 11 else 2 if now.hour < 16 else 1
        kcal = left / meals_ahead
    return int(min(KCAL_RANGE[1], max(KCAL_RANGE[0], round(kcal / 10) * 10)))


@router.post("/cook/suggest", response_model=SuggestRead)
async def suggest(data: SuggestIn, user: CurrentUser, db: DbSession) -> SuggestRead:
    kcal = data.kcal or default_kcal(db, user, data.meal_type, datetime.now())
    restrictions = data.restrictions
    if restrictions is None:
        plan = userdata.active_plan(db, user.id)
        restrictions = plan.input["restrictions"] if plan else []
    fridge = [i.strip()[:60] for i in data.ingredients if i.strip()]
    if not fridge:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "ingredients_required")
    source, recipes = await run_in_threadpool(
        cook.suggest,
        fridge,
        kcal,
        data.time_min,
        data.meal_type,
        restrictions,
        data.servings,
        userdata.language(user, data.language),
    )
    return SuggestRead(source=source, kcal_target=kcal, recipes=recipes)


@router.post("/cook/swap", response_model=SwapRead, response_model_by_alias=True)
async def swap(data: SwapIn, user: CurrentUser) -> SwapRead:
    return await run_in_threadpool(
        cook.swaps, data.dish, data.ingredients, data.goal, userdata.language(user, data.language)
    )


# --- favorites


def _favorite(db: DbSession, fav_id: int, user_id: int) -> FavoriteRecipe:
    fav = db.get(FavoriteRecipe, fav_id)
    if fav is None or fav.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Favorite not found")
    return fav


@router.get("/cook/favorites", response_model=list[FavoriteRead])
def list_favorites(user: CurrentUser, db: DbSession) -> list[FavoriteRecipe]:
    stmt = select(FavoriteRecipe).where(FavoriteRecipe.user_id == user.id)
    return list(db.scalars(stmt.order_by(FavoriteRecipe.id.desc())))


@router.post("/cook/favorites", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
def add_favorite(data: FavoriteIn, user: CurrentUser, db: DbSession) -> FavoriteRecipe:
    fav = FavoriteRecipe(
        user_id=user.id, key=data.recipe.key, recipe=data.recipe.model_dump(), note=data.note
    )
    db.add(fav)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Recipe is already a favorite") from e
    db.refresh(fav)
    return fav


@router.patch("/cook/favorites/{fav_id}", response_model=FavoriteRead)
def update_favorite(
    fav_id: int, data: FavoritePatch, user: CurrentUser, db: DbSession
) -> FavoriteRecipe:
    fav = _favorite(db, fav_id, user.id)
    fav.note = data.note
    db.commit()
    return fav


@router.delete("/cook/favorites/{fav_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(fav_id: int, user: CurrentUser, db: DbSession) -> None:
    db.delete(_favorite(db, fav_id, user.id))
    db.commit()


# --- diary


@router.post("/cook/diary", response_model=CookDiaryRead, status_code=status.HTTP_201_CREATED)
def log_recipe(data: CookDiaryIn, user: CurrentUser, db: DbSession) -> CookDiaryRead:
    r, k = data.recipe, data.servings_eaten
    meal = Meal(
        user_id=user.id,
        day=data.day or date.today(),
        name=r.name,
        calories=min(10000, round(r.calories * k)),
        protein_g=min(1000, round(r.protein_g * k, 1)),
        fat_g=min(1000, round(r.fat_g * k, 1)),
        carbs_g=min(1000, round(r.carbs_g * k, 1)),
        meal_type=data.meal_type or r.meal_type,
        source="cook",
    )
    db.add(meal)
    db.commit()
    return CookDiaryRead(
        meal=MealRead.model_validate(meal), new_achievements=achievements.evaluate(db, user.id)
    )


# --- shopping list


def _shopping(db: DbSession, user_id: int) -> list[ShoppingItem]:
    stmt = select(ShoppingItem).where(ShoppingItem.user_id == user_id)
    return list(db.scalars(stmt.order_by(ShoppingItem.checked, func.lower(ShoppingItem.name))))


def _add_items(db: DbSession, user_id: int, items: list[ShoppingIn], source: str) -> None:
    """Add items, merging into an unchecked item of the same name (and unit)."""
    open_items = {
        i.name.lower(): i
        for i in db.scalars(
            select(ShoppingItem).where(
                ShoppingItem.user_id == user_id, ShoppingItem.checked.is_(False)
            )
        )
    }
    for item in items:
        name = item.name.strip()
        existing = open_items.get(name.lower())
        if existing is not None:
            if item.amount is not None and existing.unit == item.unit:
                existing.amount = (existing.amount or 0) + item.amount
            continue
        row = ShoppingItem(
            user_id=user_id, name=name, amount=item.amount, unit=item.unit, source=source
        )
        db.add(row)
        open_items[name.lower()] = row
    db.commit()


@router.get("/shopping", response_model=list[ShoppingRead])
def list_shopping(user: CurrentUser, db: DbSession) -> list[ShoppingItem]:
    return _shopping(db, user.id)


@router.post("/shopping", response_model=list[ShoppingRead], status_code=status.HTTP_201_CREATED)
def add_shopping(data: ShoppingAdd, user: CurrentUser, db: DbSession) -> list[ShoppingItem]:
    _add_items(db, user.id, data.items, "manual")
    return _shopping(db, user.id)


@router.post("/cook/missing", response_model=list[ShoppingRead])
def add_missing(data: RecipeIn, user: CurrentUser, db: DbSession) -> list[ShoppingItem]:
    missing = {m.lower() for m in data.recipe.missing}
    items = [
        ShoppingIn(name=i.name, amount=i.amount, unit=i.unit)
        for i in data.recipe.ingredients
        if not i.have or i.name.lower() in missing
    ]
    known = {i.name.lower() for i in items}
    items += [ShoppingIn(name=m) for m in data.recipe.missing if m.lower() not in known]
    if items:
        _add_items(db, user.id, items, "cook")
    return _shopping(db, user.id)


def _item(db: DbSession, item_id: int, user_id: int) -> ShoppingItem:
    item = db.get(ShoppingItem, item_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return item


@router.patch("/shopping/{item_id}", response_model=ShoppingRead)
def update_shopping(
    item_id: int, data: ShoppingPatch, user: CurrentUser, db: DbSession
) -> ShoppingItem:
    item = _item(db, item_id, user.id)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key in ("checked", "name") and value is None:
            continue
        setattr(item, key, value)
    db.commit()
    return item


@router.delete("/shopping/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(item_id: int, user: CurrentUser, db: DbSession) -> None:
    db.delete(_item(db, item_id, user.id))
    db.commit()


@router.delete("/shopping", status_code=status.HTTP_204_NO_CONTENT)
def clear_shopping(user: CurrentUser, db: DbSession, checked: bool = False) -> None:
    stmt = delete(ShoppingItem).where(ShoppingItem.user_id == user.id)
    if checked:
        stmt = stmt.where(ShoppingItem.checked.is_(True))
    db.execute(stmt)
    db.commit()
