// Vita Health cabinet API. Every backend call the cabinet makes lives here, following
// backend/API.md. Responses are mapped to the view types below in this one place, so the
// pages don't depend on the wire format.

import enApp from "@/components/app/i18n/en";
import ruApp from "@/components/app/i18n/ru";

import { api, ApiError, getToken, setToken } from "./api";
import { today } from "./dates";

export { ApiError, getToken, setToken, today };

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ---------- Paths ----------

export const PATHS = {
  register: "/auth/register",
  login: "/auth/login",
  me: "/auth/me",
  googleLogin: "/auth/google/login",
  plan: "/plan",
  planRebuild: "/plan/rebuild",
  scan: "/scan",
  meals: "/meals",
  mealTotals: "/meals/totals",
  water: "/metrics/water_ml",
  weight: "/metrics/weight_kg",
  weightTrend: "/stats/weight",
  bmi: "/bmi",
  dailyTip: "/tips/daily",
  chat: "/chat",
  measurements: "/progress/measurements",
  photos: "/progress/photos",
  workouts: "/progress/workouts",
  achievements: "/achievements",
} as const;

// ---------- Types ----------

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active";
export type GoalKind = "lose" | "gain" | "maintain";
export type Place = "home" | "gym";
// Backend codes, plus `no_fish`, which the AI understands as free text.
export type Restriction = "vegetarian" | "vegan" | "lactose_free" | "gluten_free" | "no_pork" | "nut_free" | "no_fish";

export type PlanInput = {
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: Sex;
  goal: GoalKind;
  // Kilograms to lose or gain; 0 for maintain.
  target_change_kg: number;
  // ISO date the user wants to reach the goal by.
  target_date: string;
  activity: Activity;
  place: Place;
  restrictions: Restriction[];
};

export type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number };

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type Recipe = {
  minutes: number;
  ingredients: string[];
  steps: string[];
};

export type PlanMeal = Macros & { slot: MealSlot; name: string; recipe: Recipe };

// `day` is the Monday-based weekday index, 0..6.
export type PlanDay = { day: number; meals: PlanMeal[] };

export type ShoppingItem = { name: string; amount: string; category: string };

export type Exercise = { name: string; sets?: number; reps?: string; seconds?: number };

export type Workout = {
  day: number;
  focus: "fat_burn" | "strength" | "mobility" | "rest";
  title: string;
  minutes: number;
  exercises: Exercise[];
};

export type Plan = Macros & {
  input: PlanInput;
  created_at: string;
  bmr: number;
  tdee: number;
  weekly_change_kg: number;
  target_weight_kg: number;
  // When the goal is reached at the planned pace; may be later than target_date
  // if the requested pace was unsafe.
  forecast_date: string;
  pace_capped: boolean;
  menu: PlanDay[];
  shopping: ShoppingItem[];
  workouts: Workout[];
  source: "ai" | "formula";
};

export type ScanResult = Macros & { name: string; grams?: number; confidence?: number; items?: string[] };

export type Meal = Macros & { id: number; day: string; name: string };
export type MealInput = Macros & { name: string };

export type DayTotals = Macros & { day: string };

export type WeightPoint = { day: string; weight_kg: number };
export type WeightTrend = { points: WeightPoint[]; latest_kg: number | null; change_kg: number | null };

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export type Bmi = {
  height_cm: number;
  weight_kg: number;
  bmi: number;
  category: BmiCategory;
  target_weight_kg: number | null;
  target_bmi: number | null;
  healthy_min_kg: number;
  healthy_max_kg: number;
};

export type DailyTip = { text: string; topic?: string };

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type Measurement = { id: number; day: string; waist_cm?: number; hips_cm?: number; chest_cm?: number };
export type MeasurementInput = Omit<Measurement, "id">;

export type ProgressPhoto = { id: number; day: string; kind: "before" | "after" | "progress"; url: string };

export type WorkoutLog = { id: number; day: string; title: string };

export type BadgeCode =
  | "first_plan"
  | "first_scan"
  | "first_meal"
  | "diary_7"
  | "diary_30"
  | "weight_1"
  | "weight_5"
  | "weight_10"
  | "workouts_10"
  | "workouts_50"
  | "water_week"
  | "comeback"
  | "goal_reached";

export type Badge = { code: BadgeCode; earned_at: string | null; progress: number; target: number };
export type Streaks = { diary_days: number; workouts_total: number; water_days: number };
export type Achievements = { badges: Badge[]; streaks: Streaks; new: BadgeCode[] };

export type User = {
  id: number;
  email: string;
  name: string;
  language: string;
  height_cm?: number | null;
  birth_year?: number | null;
  sex?: Sex | null;
  activity?: Activity;
  has_password?: boolean;
  google_linked?: boolean;
  created_at: string;
};

// ---------- Wire types (backend/API.md) ----------

type Unit = "g" | "ml" | "pcs" | "tbsp" | "tsp";

type ApiPlanInput = {
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: Sex;
  goal: GoalKind;
  goal_kg: number;
  target_date: string | null;
  activity: Activity;
  location: Place;
  restrictions: string[];
  meals_per_day?: number;
  language?: "en" | "ru" | null;
};

type ApiPlan = {
  id: number | null;
  created_at: string | null;
  source: "ai" | "template";
  language: "en" | "ru";
  input: ApiPlanInput;
  nutrition: { bmr: number; tdee: number; target_calories: number; protein_g: number; fat_g: number; carbs_g: number; water_ml: number };
  forecast: {
    target_weight_kg: number;
    weekly_change_kg: number;
    eta_date: string | null;
    requested_date: string | null;
    pace: "safe" | "fast" | "capped";
  };
  menu: {
    day: number;
    meals: (Macros & {
      type: MealSlot;
      name: string;
      time_min: number;
      ingredients: { name: string; amount: number; unit: Unit }[];
      steps: string[];
    })[];
  }[];
  shopping_list: { name: string; amount: number; unit: Unit; category: string }[];
  workouts: {
    type: "fat_loss" | "strength";
    days: {
      day: number;
      title: string;
      focus: string;
      duration_min: number;
      exercises: { name: string; sets: number; reps: string; rest_sec: number; notes: string }[];
    }[];
  };
};

type ApiMeal = Macros & { id: number; day: string; name: string };

// ---------- Helpers ----------

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

function lang(locale: string): "en" | "ru" {
  return locale === "ru" ? "ru" : "en";
}

function copy(locale: string) {
  return lang(locale) === "ru" ? ruApp : enApp;
}

function amount(value: number, unit: Unit, locale: string): string {
  const n = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return `${n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ${copy(locale).units[unit]}`;
}

// Auth image URLs need the bearer token, so photos are fetched as blobs.
export async function authedObjectUrl(url: string): Promise<string> {
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const full = url.startsWith("http") ? url : `${API_BASE.replace(/\/api\/v1$/, "")}${url}`;
  const res = await fetch(full, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return URL.createObjectURL(await res.blob());
}

// ---------- Auth ----------

export async function login(email: string, password: string): Promise<void> {
  const body = new URLSearchParams({ username: email, password });
  const data = await api<{ access_token: string }>(PATHS.login, { method: "POST", body });
  setToken(data.access_token);
}

export async function register(email: string, password: string, name: string, language: string): Promise<void> {
  await api<User>(PATHS.register, json("POST", { email, password, name, language: lang(language) }));
  await login(email, password);
}

export function logout(): void {
  setToken(null);
}

export function fetchMe(): Promise<User> {
  return api<User>(PATHS.me);
}

export function saveLanguage(locale: string): Promise<User> {
  return api<User>(PATHS.me, json("PATCH", { language: lang(locale) }));
}

export async function googleEnabled(): Promise<boolean> {
  const r = await api<{ enabled: boolean }>("/auth/google/status").catch(() => ({ enabled: false }));
  return r.enabled;
}

// The backend runs the OAuth dance and sends the browser back to
// {FRONTEND_URL}/auth/callback#access_token=...&next=...
export function googleLoginUrl(next = "/plan"): string {
  return `${API_BASE}${PATHS.googleLogin}?next=${encodeURIComponent(next)}`;
}

// ---------- Plan ----------

function toApiInput(input: PlanInput, locale: string): ApiPlanInput {
  return {
    height_cm: input.height_cm,
    weight_kg: input.weight_kg,
    age: input.age,
    sex: input.sex,
    goal: input.goal,
    goal_kg: input.goal === "maintain" ? 0 : input.target_change_kg,
    target_date: input.target_date || null,
    activity: input.activity,
    location: input.place,
    restrictions: input.restrictions,
    language: lang(locale),
  };
}

function fromApiInput(input: ApiPlanInput, fallbackDate: string): PlanInput {
  return {
    height_cm: input.height_cm,
    weight_kg: input.weight_kg,
    age: input.age,
    sex: input.sex,
    goal: input.goal,
    target_change_kg: input.goal_kg,
    target_date: input.target_date ?? fallbackDate,
    activity: input.activity,
    place: input.location,
    restrictions: input.restrictions as Restriction[],
  };
}

function workoutFocus(type: "fat_loss" | "strength", focus: string): Workout["focus"] {
  if (/mobil|stretch|recover|yoga/i.test(focus)) return "mobility";
  return type === "strength" ? "strength" : "fat_burn";
}

function toPlan(p: ApiPlan, locale: string): Plan {
  const c = copy(locale);
  const n = p.nutrition;
  const created = p.created_at ?? new Date().toISOString();
  // The API numbers days 1..7 and lists only training days; the view wants Monday = 0
  // and a full week with rest days.
  const training = new Map(p.workouts.days.map((d) => [d.day - 1, d]));
  return {
    calories: n.target_calories,
    protein_g: n.protein_g,
    carbs_g: n.carbs_g,
    fat_g: n.fat_g,
    bmr: n.bmr,
    tdee: n.tdee,
    input: fromApiInput(p.input, p.forecast.eta_date ?? created.slice(0, 10)),
    created_at: created,
    weekly_change_kg: p.forecast.weekly_change_kg,
    target_weight_kg: p.forecast.target_weight_kg,
    forecast_date: p.forecast.eta_date ?? p.forecast.requested_date ?? created.slice(0, 10),
    pace_capped: p.forecast.pace === "capped",
    source: p.source === "ai" ? "ai" : "formula",
    menu: p.menu.map((d) => ({
      day: d.day - 1,
      meals: d.meals.map((m) => ({
        slot: m.type,
        name: m.name,
        calories: m.calories,
        protein_g: m.protein_g,
        carbs_g: m.carbs_g,
        fat_g: m.fat_g,
        recipe: {
          minutes: m.time_min,
          ingredients: m.ingredients.map((i) => `${i.name} — ${amount(i.amount, i.unit, locale)}`),
          steps: m.steps,
        },
      })),
    })),
    shopping: p.shopping_list.map((i) => ({
      name: i.name,
      amount: amount(i.amount, i.unit, locale),
      category: c.shopCategories[i.category as keyof typeof c.shopCategories] ?? c.shopCategories.other,
    })),
    workouts: Array.from({ length: 7 }, (_, day): Workout => {
      const w = training.get(day);
      if (!w) return { day, focus: "rest", title: c.focus.rest, minutes: 0, exercises: [] };
      return {
        day,
        focus: workoutFocus(p.workouts.type, w.focus),
        title: w.title,
        minutes: w.duration_min,
        exercises: w.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps })),
      };
    }),
  };
}

export async function fetchPlan(locale: string): Promise<Plan | null> {
  try {
    return toPlan(await api<ApiPlan>(PATHS.plan), locale);
  } catch (err) {
    // No plan built for this user yet.
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function createPlan(input: PlanInput, locale: string): Promise<Plan> {
  return toPlan(await api<ApiPlan>(PATHS.plan, json("POST", toApiInput(input, locale))), locale);
}

// Without `input` the saved answers are reused for a fresh menu.
export async function rebuildPlan(locale: string, input?: PlanInput): Promise<Plan> {
  const body = input ? toApiInput(input, locale) : { language: lang(locale) };
  return toPlan(await api<ApiPlan>(PATHS.planRebuild, json("POST", body)), locale);
}

// ---------- Scan & diary ----------

export async function scanPhoto(file: Blob, locale: string): Promise<ScanResult> {
  const body = new FormData();
  body.append("image", file, "plate.jpg");
  body.append("language", lang(locale));
  const r = await api<
    Macros & { dish: string; portion_g: number; confidence: number; items: { name: string }[] }
  >(PATHS.scan, { method: "POST", body });
  return {
    name: r.dish,
    calories: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    grams: r.portion_g,
    confidence: r.confidence,
    items: r.items.map((i) => i.name),
  };
}

export function listMeals(day = today()): Promise<Meal[]> {
  return api<ApiMeal[]>(`${PATHS.meals}?day=${day}`);
}

// Scanned meals are saved with `source: "scan"` after the user has checked them.
export function addMeal(meal: MealInput, day = today(), source: "manual" | "scan" | "plan" = "manual"): Promise<Meal> {
  return api<ApiMeal>(PATHS.meals, json("POST", { day, source, ...roundMacros(meal) }));
}

export function deleteMeal(id: number): Promise<void> {
  return api<void>(`${PATHS.meals}/${id}`, { method: "DELETE" });
}

export function mealTotals(start: string, end: string): Promise<DayTotals[]> {
  return api<DayTotals[]>(`${PATHS.mealTotals}?start=${start}&end=${end}`);
}

export function addWater(ml: number, day = today()): Promise<{ value: number }> {
  return api<{ value: number }>(`${PATHS.water}/add`, json("POST", { day, delta: ml }));
}

export async function waterToday(day = today()): Promise<number> {
  const rows = await api<{ day: string; value: number }[]>(`${PATHS.water}?start=${day}&end=${day}`);
  return rows[0]?.value ?? 0;
}

function roundMacros<T extends Macros>(m: T): T {
  return {
    ...m,
    calories: Math.round(m.calories),
    protein_g: Math.round(m.protein_g * 10) / 10,
    carbs_g: Math.round(m.carbs_g * 10) / 10,
    fat_g: Math.round(m.fat_g * 10) / 10,
  };
}

// ---------- Body ----------

export function logWeight(weight_kg: number, day = today()): Promise<unknown> {
  return api(PATHS.weight, json("PUT", { day, value: weight_kg }));
}

export function weightTrend(span = 90): Promise<WeightTrend> {
  return api<WeightTrend>(`${PATHS.weightTrend}?span=${Math.min(365, Math.max(2, span))}`);
}

export async function fetchBmi(): Promise<Bmi | null> {
  try {
    return await api<Bmi>(PATHS.bmi);
  } catch (err) {
    // No height or weight yet.
    if (err instanceof ApiError && err.status === 422) return null;
    throw err;
  }
}

// ---------- Coach ----------

export async function dailyTip(): Promise<DailyTip> {
  const r = await api<{ title: string; text: string; category: string }>(PATHS.dailyTip);
  return { text: r.text, topic: r.category };
}

export async function chatHistory(): Promise<ChatMessage[]> {
  const rows = await api<ChatMessage[]>(`${PATHS.chat}?limit=50`);
  return rows.map(({ role, content }) => ({ role, content }));
}

// The server keeps the conversation, so only the new question is sent.
export async function chat(message: string, locale: string): Promise<ChatMessage> {
  const r = await api<{ reply: ChatMessage }>(PATHS.chat, json("POST", { message, language: lang(locale) }));
  return { role: "assistant", content: r.reply.content };
}

// ---------- Progress ----------

type ApiMeasurement = { id: number; day: string; waist_cm: number | null; hips_cm: number | null; chest_cm: number | null };

function toMeasurement(m: ApiMeasurement): Measurement {
  return { id: m.id, day: m.day, waist_cm: m.waist_cm ?? undefined, hips_cm: m.hips_cm ?? undefined, chest_cm: m.chest_cm ?? undefined };
}

export async function listMeasurements(): Promise<Measurement[]> {
  return (await api<ApiMeasurement[]>(PATHS.measurements)).map(toMeasurement);
}

// One row per day: saving again on the same day updates it.
export async function addMeasurement(m: MeasurementInput): Promise<Measurement> {
  return toMeasurement(await api<ApiMeasurement>(PATHS.measurements, json("PUT", m)));
}

export function listPhotos(): Promise<ProgressPhoto[]> {
  return api<ProgressPhoto[]>(PATHS.photos);
}

export function uploadPhoto(file: Blob, kind: ProgressPhoto["kind"], day = today()): Promise<ProgressPhoto> {
  const body = new FormData();
  body.append("image", file, "progress.jpg");
  body.append("kind", kind);
  body.append("day", day);
  return api<ProgressPhoto>(PATHS.photos, { method: "POST", body });
}

export function deletePhoto(id: ProgressPhoto["id"]): Promise<void> {
  return api<void>(`${PATHS.photos}/${id}`, { method: "DELETE" });
}

export function listWorkouts(): Promise<WorkoutLog[]> {
  return api<WorkoutLog[]>(PATHS.workouts);
}

export async function logWorkout(title: string, day = today()): Promise<WorkoutLog> {
  const r = await api<{ workout: WorkoutLog }>(PATHS.workouts, json("POST", { day, title }));
  return r.workout;
}

export function deleteWorkout(id: WorkoutLog["id"]): Promise<void> {
  return api<void>(`${PATHS.workouts}/${id}`, { method: "DELETE" });
}

// ---------- Achievements ----------

export async function fetchAchievements(): Promise<Achievements> {
  const r = await api<{
    achievements: { code: BadgeCode; unlocked: boolean; unlocked_at: string | null; progress: number; target: number }[];
    streaks: { diary_current: number; diary_longest: number; workouts_total: number; water_current: number };
    new: BadgeCode[];
  }>(PATHS.achievements);
  return {
    badges: r.achievements.map((a) => ({
      code: a.code,
      earned_at: a.unlocked ? (a.unlocked_at ?? new Date().toISOString()) : null,
      progress: a.progress,
      target: a.target,
    })),
    streaks: { diary_days: r.streaks.diary_current, workouts_total: r.streaks.workouts_total, water_days: r.streaks.water_current },
    new: r.new,
  };
}
