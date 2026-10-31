# Vita Health API

Base URL: `http://localhost:8001/api/v1` for the backend worktree (`http://localhost:8000/api/v1` on the main dev server).
Interactive docs: `/docs` (Swagger) on the same host.

- JSON everywhere except the upload endpoints (`multipart/form-data`) and photo files.
- Auth: `Authorization: Bearer <access_token>`. Endpoints marked **public** work without it.
- Dates are ISO `YYYY-MM-DD`, timestamps ISO 8601 with timezone.
- Errors: `{"detail": "message"}` (or FastAPI's validation list for 422).
- `language` is `"en"` or `"ru"`; AI and template texts come back in that language
  (default: the user's `language`, else `en`).
- `source` on AI-backed responses is `"ai"` (Claude) or `"template"` (deterministic fallback when
  `ANTHROPIC_API_KEY` is not set or the AI call fails). The response shape is identical either way.

---

## 1. Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | public. `{email, password (8–128), name?, language?}` → `UserRead`, 201. 409 if the email exists |
| POST | `/auth/login` | public. **form-urlencoded** `username=<email>&password=...` → `{access_token, token_type: "bearer"}` |
| GET | `/auth/me` | → `UserRead` |
| PATCH | `/auth/me` | `{name?, language?, height_cm?, birth_year?, sex?, activity?}` → `UserRead` |
| POST | `/auth/password` | `{current_password, new_password}` → 204. Google-only accounts (no password yet) may omit `current_password` to set one |
| GET | `/auth/google/login` | public. 307 redirect to Google's consent screen. Optional `?next=/app` (path on the frontend to return to) |
| GET | `/auth/google/callback` | public, called by Google. Redirects to `{FRONTEND_URL}/auth/callback#access_token=<jwt>&next=<path>`; on failure `#error=<code>` (`google_disabled`, `google_failed`, `invalid_state`) |
| GET | `/auth/google/status` | public. `{enabled: bool}` — hide the Google button when false |

`UserRead`:
```json
{"id": 1, "email": "a@b.co", "name": "Ann", "language": "en", "height_cm": 170, "birth_year": 1995,
 "sex": "female", "activity": "light", "has_password": true, "google_linked": false,
 "created_at": "2026-10-31T10:00:00Z"}
```
`sex`: `male | female`. `activity`: `sedentary | light | moderate | active`.

Google flow for the frontend: link the button to `GET {API}/auth/google/login?next=/app`, add a
page `/auth/callback` that reads `location.hash`, stores `access_token` and navigates to `next`.
A Google login with an email that already has a password account links to that account.

---

## 2. Personal plan

### POST `/plan/preview` — public, nothing is saved
### POST `/plan` — build and save the user's plan (replaces the active one)

Request `PlanInput`:
```json
{
  "height_cm": 170, "weight_kg": 82, "age": 31, "sex": "female",
  "goal": "lose",                 // lose | gain | maintain
  "goal_kg": 6,                   // how many kg to lose/gain (0..50), ignored for maintain
  "target_date": "2027-03-01",    // optional; without it a safe pace is chosen
  "activity": "light",
  "location": "home",             // home | gym
  "restrictions": ["vegetarian", "lactose_free"],  // free-form strings too, max 10
  "meals_per_day": 4,             // 3..5, default 4
  "language": "ru"                // optional
}
```
Known restriction codes (used by the template fallback; AI understands anything):
`vegetarian, vegan, pescatarian, lactose_free, gluten_free, nut_free, no_pork, low_carb, halal`.

Saving a plan also updates the profile (`height_cm`, `sex`, `activity`, `birth_year`), logs today's
`weight_kg` metric if none is logged, and sets `goals.calories` to the plan target.

Response `Plan` (201 for `POST /plan`, 200 for preview):
```json
{
  "id": 3,                        // null in preview
  "created_at": "2026-10-31T10:00:00Z",
  "source": "ai",
  "language": "ru",
  "input": { ...PlanInput },
  "nutrition": {
    "bmr": 1580, "tdee": 2173, "target_calories": 1673, "daily_delta": -500,
    "protein_g": 131, "fat_g": 56, "carbs_g": 161,
    "water_ml": 2460
  },
  "forecast": {
    "start_weight_kg": 82, "target_weight_kg": 76,
    "weekly_change_kg": -0.45, "weeks": 13.3,
    "eta_date": "2027-02-01",
    "requested_date": "2027-03-01",
    "pace": "safe",               // safe | fast | capped (requested date needs an unsafe pace, so it was capped)
    "bmi_now": 28.4, "bmi_target": 26.3
  },
  "menu": [                       // 7 days, day 1..7
    {"day": 1, "meals": [
      {"type": "breakfast",       // breakfast | lunch | dinner | snack
       "name": "Овсянка с ягодами", "calories": 420, "protein_g": 22, "fat_g": 12, "carbs_g": 55,
       "time_min": 10,
       "ingredients": [{"name": "Овсяные хлопья", "amount": 60, "unit": "g"}],
       "steps": ["Залить хлопья молоком...", "..."]}
    ], "totals": {"calories": 1670, "protein_g": 130, "fat_g": 55, "carbs_g": 160}}
  ],
  "shopping_list": [
    {"name": "Овсяные хлопья", "amount": 420, "unit": "g", "category": "grains"}
  ],                              // category: produce | protein | dairy | grains | pantry | other
  "workouts": {
    "type": "fat_loss",           // fat_loss (lose/maintain) | strength (gain)
    "location": "home",
    "days_per_week": 4,
    "days": [
      {"day": 1, "title": "Full body + cardio", "focus": "full_body", "duration_min": 40,
       "exercises": [{"name": "Squats", "sets": 3, "reps": "12-15", "rest_sec": 60, "notes": ""}]}
    ],                            // only training days; rest days are omitted
    "notes": ["Warm up 5–10 minutes", "..."]
  }
}
```
Units: `g | ml | pcs | tbsp | tsp`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/plan` | the active plan → `Plan`; 404 if the user has none |
| POST | `/plan/rebuild` | rebuild from the saved input, optionally with changes: body is a partial `PlanInput` (e.g. `{"weight_kg": 79}` or `{}` for a fresh menu) → `Plan`, 201. Weight defaults to the latest logged weight. 404 without a plan |
| GET | `/plan/history` | `[{id, created_at, source, target_calories, goal, goal_kg}]`, newest first |

---

## 3. Calorie scan & food diary

### POST `/scan` — `multipart/form-data`
| Field | Type | Notes |
| --- | --- | --- |
| `image` | file | jpeg/png/webp/gif, ≤ 8 MB |
| `add_to_diary` | bool | default `false` |
| `day` | date | default today; used with `add_to_diary` |
| `meal_type` | string | `breakfast/lunch/dinner/snack`, optional |
| `hint` | string | optional, e.g. "chicken salad" — improves the guess (and drives the fallback) |
| `language` | string | optional |

Response:
```json
{
  "dish": "Chicken salad", "calories": 430, "protein_g": 32, "fat_g": 24, "carbs_g": 18,
  "portion_g": 350, "confidence": 0.8,          // 0..1; 0 means "could not recognize"
  "items": [{"name": "Chicken breast", "calories": 200, "grams": 120}],
  "source": "ai",
  "meal": null,                                 // MealRead when add_to_diary=true
  "new_achievements": ["first_scan"]
}
```
Without an AI key the scan uses `hint` (a small built-in food table) or returns a generic
estimate with `confidence: 0`; the frontend should then let the user edit before saving.
To save an edited result call `POST /meals` with `source: "scan"`.

### Meals (existing, extended)
`MealIn`: `{day, name, calories, protein_g?, carbs_g?, fat_g?, meal_type?, source?}`,
`source`: `manual | scan | plan` (default `manual`). `MealRead` adds `id`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/meals` | → `MealRead`, 201 |
| GET | `/meals?day=` | list for a day |
| GET | `/meals/totals?start=&end=` | `[{day, calories, protein_g, carbs_g, fat_g}]` |
| PUT | `/meals/{id}` | full update |
| DELETE | `/meals/{id}` | 204 |

### GET `/diary?day=YYYY-MM-DD` — day counter against the norm
```json
{
  "day": "2026-10-31",
  "meals": [ MealRead, ... ],
  "totals":    {"calories": 1200, "protein_g": 80, "fat_g": 40, "carbs_g": 120},
  "targets":   {"calories": 1673, "protein_g": 131, "fat_g": 56, "carbs_g": 161},
  "remaining": {"calories": 473,  "protein_g": 51,  "fat_g": 16, "carbs_g": 41},
  "percent":   {"calories": 72,   "protein_g": 61,  "fat_g": 71, "carbs_g": 75},
  "water_ml": 1250, "water_target_ml": 2460,
  "targets_source": "plan"        // plan | goals (no plan: goals.calories with a 25/30/45 split)
}
```
`remaining` can be negative (over the norm).

---

## 4. BMI

### GET `/bmi` — uses the latest logged weight (else the plan's), profile height, plan target
Optional query overrides: `height_cm`, `weight_kg`, `target_weight_kg`.
### GET `/bmi/calc?height_cm=&weight_kg=&target_weight_kg=` — public, same response

```json
{
  "height_cm": 170, "weight_kg": 82, "bmi": 28.4, "category": "overweight",
  "target_weight_kg": 76, "target_bmi": 26.3, "target_category": "overweight",
  "healthy_min_kg": 53.5, "healthy_max_kg": 72.0,
  "to_healthy_kg": -10.0,          // change needed to enter the healthy range, 0 if inside
  "scale": [
    {"category": "underweight", "min": null, "max": 18.5},
    {"category": "normal",      "min": 18.5, "max": 25},
    {"category": "overweight",  "min": 25,   "max": 30},
    {"category": "obese",       "min": 30,   "max": null}
  ]
}
```
Missing height or weight → 422 `{"detail": "height_and_weight_required"}`.

---

## 5. AI coach

### GET `/tips/daily?day=` — one tip per day, cached per user and day
```json
{"day": "2026-10-31", "title": "Protein first", "text": "You're 50 g short on protein ...",
 "category": "nutrition", "source": "ai"}
```
`category`: `nutrition | workout | water | sleep | motivation`. `?refresh=true` regenerates.

### Chat
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/chat` | `{message (1–2000), language?}` → `{reply: ChatMessage, source}`. The last 20 messages are sent as context |
| GET | `/chat?limit=50` | history, oldest first: `[ChatMessage]` |
| DELETE | `/chat` | clear history, 204 |

`ChatMessage`: `{id, role: "user" | "assistant", content, created_at}`.
The coach answers nutrition/training/healthy-habit questions only and knows the user's plan and
today's diary. Not medical advice.

---

## 6. Progress

### Body measurements (one row per day, upsert)
| Method | Path | Notes |
| --- | --- | --- |
| PUT | `/progress/measurements` | `{day, waist_cm?, hips_cm?, chest_cm?}` (at least one, 20–300) → `Measurement` |
| GET | `/progress/measurements?start=&end=` | oldest first |
| DELETE | `/progress/measurements/{id}` | 204 |

`Measurement`: `{id, day, waist_cm, hips_cm, chest_cm}`. Weight stays in `/metrics/weight_kg`
and `/stats/weight`.

### Before/after photos (private)
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/progress/photos` | multipart: `image` (jpeg/png/webp, ≤ 8 MB), `day?`, `kind?` (`before/after/progress`, default `progress`), `note?` → `Photo`, 201 |
| GET | `/progress/photos` | `[Photo]`, oldest first |
| GET | `/progress/photos/{id}/file` | the image bytes; **owner only** (404 for anyone else) |
| DELETE | `/progress/photos/{id}` | removes the file too, 204 |

`Photo`: `{id, day, kind, note, content_type, created_at, url: "/api/v1/progress/photos/7/file"}`.
The file endpoint needs the bearer header, so `<img src>` won't work directly: fetch it with the
header, then `URL.createObjectURL(await res.blob())`.

### Workout check-ins
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/progress/workouts` | `{day?, title, kind?, duration_min?, plan_day?, note?}` → `{workout: Workout, new_achievements: [...]}`, 201 |
| GET | `/progress/workouts?start=&end=` | newest first |
| DELETE | `/progress/workouts/{id}` | 204 |

`Workout`: `{id, day, title, kind, duration_min, plan_day, note, created_at}`;
`kind`: `fat_loss | strength | cardio | other` (default `other`).

### GET `/progress/summary`
```json
{"start_weight_kg": 82, "current_weight_kg": 79.5, "change_kg": -2.5, "target_weight_kg": 76,
 "goal_progress_percent": 42, "workouts_total": 7, "workouts_this_week": 3,
 "latest_measurement": Measurement | null, "photos_total": 2}
```

---

## 7. Achievements & streaks

### GET `/achievements`
```json
{
  "achievements": [
    {"code": "first_scan", "unlocked": true, "unlocked_at": "2026-10-31T10:00:00Z",
     "progress": 1, "target": 1}
  ],
  "streaks": {"diary_current": 3, "diary_longest": 9, "workouts_total": 7, "water_current": 2},
  "new": ["diary_7"]              // unlocked since the previous GET /achievements (then cleared)
}
```
Codes (titles/descriptions are translated on the frontend):

| Code | Rule |
| --- | --- |
| `first_plan` | built a first plan |
| `first_scan` | first photo scan |
| `first_meal` | first meal in the diary |
| `diary_7` | meals logged 7 days in a row |
| `diary_30` | 30 days in a row |
| `weight_1`, `weight_5`, `weight_10` | 1/5/10 kg towards the goal direction (lost for `lose`, gained for `gain`; `lose` when there is no plan) from the start weight |
| `workouts_10`, `workouts_50` | 10 / 50 workout check-ins |
| `water_week` | water goal met 7 days in a row |
| `comeback` | logged something again after a break of 3+ days |
| `goal_reached` | reached the plan's target weight |

Achievements are granted automatically after meals, scans, weight/water metrics, workouts and plan
saves; `POST /scan` and `POST /progress/workouts` also return `new_achievements` directly.

---

## Existing endpoints (unchanged)
`/metrics/{water_ml|steps|weight_kg|mood}` (PUT set, POST `/add`, GET list), `/sleep`, `/habits`,
`/goals` (GET/PATCH `{sleep_minutes, water_ml, steps, calories}`), `/dashboard`,
`/stats/week`, `/stats/weight`, `/stats/body`, `/export/daily`. See `/docs`.
