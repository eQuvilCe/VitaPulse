from datetime import date
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DbSession
from app.api.progress import check_in
from app.schemas.progress import WorkoutCreated, WorkoutIn
from app.services import exercise_catalog as catalog
from app.services import userdata

router = APIRouter(tags=["exercises"])

Lang = Literal["en", "ru"]
Tag = Literal["cardio", "hiit", "strength", "core", "stretch"]
Place = Literal["home", "gym"]
Level = Literal["beginner", "intermediate", "advanced"]
Muscle = Literal["full_body", "legs", "glutes", "core", "chest", "back", "shoulders", "arms"]


class Dosage(BaseModel):
    mode: Literal["time", "reps"]
    sets: int
    reps: str | None
    seconds: int | None
    rest_sec: int


class ExerciseRead(BaseModel):
    id: str
    name: str
    description: str
    steps: list[str]
    mistakes: list[str]
    muscles: list[str]
    level: Level
    places: list[Place]
    equipment: list[str]
    tags: list[Tag]
    met: float
    kcal_per_min: float
    dosage: Dosage
    image_url: str | None


class WorkoutItem(BaseModel):
    exercise_id: str
    name: str
    mode: Literal["time", "reps"]
    sets: int
    seconds: int | None
    reps: str | None
    rest_sec: int


class ReadyWorkout(BaseModel):
    id: str
    title: str
    description: str
    level: Level
    place: Place
    tags: list[Tag]
    equipment: list[str]
    duration_min: int
    kcal_estimate: int
    rounds: int
    items: list[WorkoutItem]


class CompleteIn(BaseModel):
    day: date | None = None
    duration_min: int | None = Field(default=None, ge=1, le=600)
    note: str = Field(default="", max_length=300)


def _weight():
    return Query(default=70, gt=30, lt=300)


@router.get("/exercises", response_model=list[ExerciseRead])
def list_exercises(
    tag: Tag | None = None,
    place: Place | None = None,
    level: Level | None = None,
    muscle: Muscle | None = None,
    equipment: str | None = None,
    q: str | None = Query(default=None, max_length=60),
    lang: Lang = "en",
    weight_kg: float = _weight(),
) -> list[dict]:
    needle = (q or "").strip().lower()
    found = []
    for ex in catalog.EXERCISES:
        if tag and tag not in ex["tags"]:
            continue
        if place and place not in ex["places"]:
            continue
        if level and level != ex["level"]:
            continue
        if muscle and muscle not in ex["muscles"]:
            continue
        if equipment and equipment not in ex["equipment"]:
            continue
        if needle and not any(
            needle in f"{t['name']} {t['description']}".lower() for t in ex["text"].values()
        ):
            continue
        found.append(catalog.localize_exercise(ex, lang, weight_kg))
    return sorted(found, key=lambda e: e["name"].lower())


@router.get("/exercises/{exercise_id}", response_model=ExerciseRead)
def get_exercise(exercise_id: str, lang: Lang = "en", weight_kg: float = _weight()) -> dict:
    ex = catalog.BY_ID.get(exercise_id)
    if ex is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return catalog.localize_exercise(ex, lang, weight_kg)


@router.get("/workouts", response_model=list[ReadyWorkout])
def list_workouts(
    place: Place | None = None,
    level: Level | None = None,
    tag: Tag | None = None,
    max_minutes: int | None = Query(default=None, ge=1, le=300),
    lang: Lang = "en",
    weight_kg: float = _weight(),
) -> list[dict]:
    return [
        catalog.localize_workout(w, lang, weight_kg)
        for w in catalog.WORKOUTS
        if (not place or w["place"] == place)
        and (not level or w["level"] == level)
        and (not tag or tag in w["tags"])
        and (not max_minutes or w["duration_min"] <= max_minutes)
    ]


def _ready(workout_id: str) -> dict:
    w = catalog.WORKOUTS_BY_ID.get(workout_id)
    if w is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")
    return w


@router.get("/workouts/{workout_id}", response_model=ReadyWorkout)
def get_workout(workout_id: str, lang: Lang = "en", weight_kg: float = _weight()) -> dict:
    return catalog.localize_workout(_ready(workout_id), lang, weight_kg)


def _kind(tags: list[str]) -> str:
    if "hiit" in tags or "cardio" in tags:
        return "cardio" if "strength" not in tags else "fat_loss"
    return "strength" if "strength" in tags else "other"


@router.post(
    "/workouts/{workout_id}/complete",
    response_model=WorkoutCreated,
    status_code=status.HTTP_201_CREATED,
)
def complete_workout(
    workout_id: str, user: CurrentUser, db: DbSession, data: CompleteIn | None = None
) -> WorkoutCreated:
    data = data or CompleteIn()
    weight = userdata.latest_weight(db, user.id) or 70.0
    w = catalog.localize_workout(_ready(workout_id), userdata.language(user), weight)
    duration = data.duration_min or w["duration_min"]
    kcal = round(w["kcal_estimate"] * duration / w["duration_min"])
    return check_in(
        db,
        user.id,
        WorkoutIn(
            day=data.day,
            title=w["title"],
            kind=_kind(w["tags"]),
            duration_min=duration,
            program_id=w["id"],
            kcal=kcal,
            note=data.note,
        ),
    )
