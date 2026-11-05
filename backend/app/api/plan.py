from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update

from app.api.deps import CurrentUser, DbSession
from app.api.goals import get_or_create_goal
from app.models import DailyMetric, Plan, User
from app.schemas.plan import PlanInput, PlanRead, PlanRebuild, PlanSummary
from app.services import achievements, planner, userdata

router = APIRouter(prefix="/plan", tags=["plan"])


def _read(plan: Plan) -> PlanRead:
    return PlanRead(
        id=plan.id,
        created_at=plan.created_at,
        source=plan.source,
        language=plan.language,
        input=PlanInput.model_validate(plan.input),
        **plan.data,
    )


def _sync_profile(db: DbSession, user: User, data: PlanInput, plan_data: dict) -> None:
    """Keep the profile, goals and weight log in line with the questionnaire."""
    user.height_cm = data.height_cm
    user.sex = data.sex
    user.activity = data.activity
    user.birth_year = date.today().year - data.age
    goal = get_or_create_goal(db, user.id)
    goal.calories = plan_data["nutrition"]["target_calories"]
    goal.water_ml = min(10000, max(250, plan_data["nutrition"]["water_ml"]))
    today = date.today()
    if userdata.metric(db, user.id, "weight_kg", today) is None:
        db.add(DailyMetric(user_id=user.id, kind="weight_kg", day=today, value=data.weight_kg))


def _save(db: DbSession, user: User, data: PlanInput) -> Plan:
    lang = userdata.language(user, data.language)
    source, plan_data = planner.build(data, lang)
    db.execute(
        update(Plan).where(Plan.user_id == user.id, Plan.active.is_(True)).values(active=False)
    )
    plan = Plan(
        user_id=user.id,
        source=source,
        language=lang,
        input=data.model_dump(mode="json"),
        data=plan_data,
    )
    db.add(plan)
    _sync_profile(db, user, data, plan_data)
    db.commit()
    db.refresh(plan)
    achievements.evaluate(db, user.id)
    return plan


@router.post("/preview", response_model=PlanRead)
def preview_plan(data: PlanInput) -> PlanRead:
    """Public: the full plan for the questionnaire, not saved."""
    lang = data.language or "en"
    source, plan_data = planner.build(data, lang)
    return PlanRead(id=None, created_at=None, source=source, language=lang, input=data, **plan_data)


@router.post("", response_model=PlanRead, status_code=status.HTTP_201_CREATED)
def create_plan(data: PlanInput, user: CurrentUser, db: DbSession) -> PlanRead:
    return _read(_save(db, user, data))


@router.get("", response_model=PlanRead)
def read_plan(user: CurrentUser, db: DbSession) -> PlanRead:
    plan = userdata.active_plan(db, user.id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No plan yet")
    return _read(plan)


@router.post("/rebuild", response_model=PlanRead, status_code=status.HTTP_201_CREATED)
def rebuild_plan(changes: PlanRebuild, user: CurrentUser, db: DbSession) -> PlanRead:
    plan = userdata.active_plan(db, user.id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No plan yet")
    merged = dict(plan.input)
    overrides = changes.model_dump(mode="json", exclude_unset=True)
    if "weight_kg" not in overrides:
        latest = userdata.latest_weight(db, user.id)
        if latest is not None:
            overrides["weight_kg"] = latest
    if "weight_kg" in overrides and "goal_kg" not in overrides and merged["goal"] != "maintain":
        # Keep aiming at the same target weight from the new starting point.
        target = plan.data["forecast"]["target_weight_kg"]
        left = overrides["weight_kg"] - target
        if merged["goal"] == "gain":
            left = -left
        overrides["goal_kg"] = round(min(50, max(0, left)), 1)
    merged.update(overrides)
    if merged.get("target_date") and date.fromisoformat(merged["target_date"]) <= date.today():
        merged["target_date"] = None
    return _read(_save(db, user, PlanInput.model_validate(merged)))


@router.get("/history", response_model=list[PlanSummary])
def plan_history(user: CurrentUser, db: DbSession) -> list[PlanSummary]:
    plans = db.scalars(select(Plan).where(Plan.user_id == user.id).order_by(Plan.id.desc()))
    return [
        PlanSummary(
            id=p.id,
            created_at=p.created_at,
            source=p.source,
            target_calories=p.data["nutrition"]["target_calories"],
            goal=p.input["goal"],
            goal_kg=p.input["goal_kg"],
        )
        for p in plans
    ]
