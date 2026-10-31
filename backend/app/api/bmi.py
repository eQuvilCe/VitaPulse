from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.services import body, userdata

router = APIRouter(prefix="/bmi", tags=["bmi"])


class ScaleBand(BaseModel):
    category: str
    min: float | None
    max: float | None


class BmiRead(BaseModel):
    height_cm: float
    weight_kg: float
    bmi: float
    category: str
    target_weight_kg: float | None
    target_bmi: float | None
    target_category: str | None
    healthy_min_kg: float
    healthy_max_kg: float
    to_healthy_kg: float
    scale: list[ScaleBand]


def compute(height_cm: float | None, weight_kg: float | None, target: float | None) -> BmiRead:
    if not height_cm or not weight_kg:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "height_and_weight_required")
    value = body.bmi(weight_kg, height_cm)
    low, high = body.healthy_range(height_cm)
    target_bmi = body.bmi(target, height_cm) if target else None
    return BmiRead(
        height_cm=height_cm,
        weight_kg=weight_kg,
        bmi=value,
        category=body.bmi_category(value),
        target_weight_kg=target,
        target_bmi=target_bmi,
        target_category=body.bmi_category(target_bmi) if target_bmi else None,
        healthy_min_kg=low,
        healthy_max_kg=high,
        to_healthy_kg=body.to_healthy(weight_kg, height_cm),
        scale=body.BMI_SCALE,
    )


Height = Query(default=None, gt=100, lt=250)
Weight = Query(default=None, gt=30, lt=300)


@router.get("", response_model=BmiRead)
def my_bmi(
    user: CurrentUser,
    db: DbSession,
    height_cm: float | None = Height,
    weight_kg: float | None = Weight,
    target_weight_kg: float | None = Weight,
) -> BmiRead:
    plan = userdata.active_plan(db, user.id)
    height = height_cm or user.height_cm or (plan.input["height_cm"] if plan else None)
    weight = weight_kg or userdata.latest_weight(db, user.id)
    if weight is None and plan:
        weight = plan.input["weight_kg"]
    target = target_weight_kg
    if target is None and plan and plan.input["goal"] != "maintain":
        target = plan.data["forecast"]["target_weight_kg"]
    return compute(height, weight, target)


@router.get("/calc", response_model=BmiRead)
def calc_bmi(
    height_cm: float = Query(gt=100, lt=250),
    weight_kg: float = Query(gt=30, lt=300),
    target_weight_kg: float | None = Weight,
) -> BmiRead:
    """Public calculator for the landing page."""
    return compute(height_cm, weight_kg, target_weight_kg)
