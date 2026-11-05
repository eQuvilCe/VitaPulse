from datetime import date
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Meal
from app.schemas.meal import DiaryRead, MealRead, MealType, ScanRead
from app.services import achievements, scanner, uploads, userdata

router = APIRouter(tags=["scan"])

# The vision API accepts images up to 5 MB.
SCAN_MAX_BYTES = 5 * 2**20
SCAN_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/scan", response_model=ScanRead)
async def scan_plate(
    user: CurrentUser,
    db: DbSession,
    image: Annotated[UploadFile, File()],
    add_to_diary: Annotated[bool, Form()] = False,
    day: Annotated[date | None, Form()] = None,
    meal_type: Annotated[MealType | None, Form()] = None,
    hint: Annotated[str | None, Form(max_length=200)] = None,
    language: Annotated[str | None, Form()] = None,
) -> ScanRead:
    data, media_type, _ = await uploads.read_image(image, SCAN_MAX_BYTES, SCAN_TYPES)
    source, result = await run_in_threadpool(
        scanner.scan, data, media_type, hint, userdata.language(user, language)
    )
    meal = None
    if add_to_diary:
        meal = Meal(
            user_id=user.id,
            day=day or date.today(),
            name=result.dish,
            calories=min(result.calories, 10000),
            protein_g=min(result.protein_g, 1000),
            carbs_g=min(result.carbs_g, 1000),
            fat_g=min(result.fat_g, 1000),
            meal_type=meal_type,
            source="scan",
        )
        db.add(meal)
        db.commit()
    return ScanRead(
        **result.model_dump(),
        source=source,
        meal=MealRead.model_validate(meal) if meal else None,
        new_achievements=achievements.evaluate(db, user.id, extra=("first_scan",)),
    )


def _pct(value: float, target: float) -> float:
    return round(value / target * 100) if target else 0


@router.get("/diary", response_model=DiaryRead)
def diary(user: CurrentUser, db: DbSession, day: date | None = None) -> DiaryRead:
    day = day or date.today()
    meals = list(
        db.scalars(select(Meal).where(Meal.user_id == user.id, Meal.day == day).order_by(Meal.id))
    )
    totals = userdata.day_totals(db, user.id, day)
    targets, water_target, targets_source = userdata.daily_targets(db, user.id)
    return DiaryRead(
        day=day,
        meals=meals,
        totals=totals,
        targets=targets,
        remaining={k: round(targets[k] - totals[k], 1) for k in targets},
        percent={k: _pct(totals[k], targets[k]) for k in targets},
        water_ml=userdata.metric(db, user.id, "water_ml", day) or 0,
        water_target_ml=water_target,
        targets_source=targets_source,
    )
