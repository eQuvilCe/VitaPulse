// Vita Health cabinet API. Every backend call the cabinet makes lives here, so the
// contract can be adjusted in one place once backend/API.md lands.
//
// Endpoints that already exist (auth, meals, metrics, stats) are called as is.
// The newer ones (plan, scan, bmi, tips, chat, progress, achievements) fall back to
// local calculations from ./api-fallback when the backend answers 404/405/501 or is
// unreachable, so the cabinet stays usable while they are being built.

import { api, ApiError, getToken, setToken } from "./api";
import * as local from "./api-fallback";

export { ApiError, getToken, setToken };

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
  water: "/metrics/water_ml/add",
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
export type Restriction = "vegetarian" | "vegan" | "no_lactose" | "no_gluten" | "no_pork" | "no_nuts" | "no_fish";

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
  notes?: string;
};

export type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number };

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type Recipe = {
  minutes: number;
  ingredients: string[];
  steps: string[];
};

export type PlanMeal = Macros & { slot: MealSlot; name: string; recipe: Recipe };

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
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export type DailyTip = { text: string; topic?: string };

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type Measurement = { id: number | string; day: string; waist_cm?: number; hips_cm?: number; chest_cm?: number };
export type MeasurementInput = Omit<Measurement, "id">;

export type ProgressPhoto = { id: number | string; day: string; kind: "before" | "after"; url: string };

export type WorkoutLog = { id: number | string; day: string; title: string };

export type BadgeCode =
  | "first_scan"
  | "diary_7"
  | "weight_1"
  | "weight_5"
  | "weight_10"
  | "workouts_10"
  | "water_week"
  | "comeback"
  | "first_plan";

export type Badge = { code: BadgeCode; earned_at: string | null; progress: number; target: number };
export type Streaks = { diary_days: number; workout_days: number; water_days: number };
export type Achievements = { badges: Badge[]; streaks: Streaks };

export type User = {
  id: number;
  email: string;
  name: string;
  language: string;
  height_cm?: number | null;
  birth_year?: number | null;
  sex?: Sex | null;
  activity?: Activity;
  created_at: string;
};

// ---------- Helpers ----------

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

// True when the backend has not shipped the endpoint yet or cannot be reached.
function missing(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 404 || err.status === 405 || err.status === 501;
  return err instanceof TypeError;
}

async function orLocal<T>(remote: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  try {
    return await remote();
  } catch (err) {
    if (missing(err)) return fallback();
    throw err;
  }
}

export function today(): string {
  return local.isoDay(new Date());
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
  await api<User>(PATHS.register, json("POST", { email, password, name, language }));
  await login(email, password);
}

export function logout(): void {
  setToken(null);
}

export function fetchMe(): Promise<User> {
  return api<User>(PATHS.me);
}

// The backend runs the OAuth dance and sends the browser back to /auth/callback?token=...
export function googleLoginUrl(next = "/plan"): string {
  const redirect = typeof window === "undefined" ? "" : `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  return `${API_BASE}${PATHS.googleLogin}?redirect_uri=${encodeURIComponent(redirect)}`;
}

// ---------- Plan ----------

export function fetchPlan(locale: string): Promise<Plan | null> {
  return orLocal(
    async () => {
      try {
        return await api<Plan>(`${PATHS.plan}?lang=${locale}`);
      } catch (err) {
        // Not built yet for this user.
        if (err instanceof ApiError && err.status === 404 && err.message !== "Not Found") return null;
        throw err;
      }
    },
    () => local.loadPlan(locale),
  );
}

export function createPlan(input: PlanInput, locale: string): Promise<Plan> {
  return orLocal(
    () => api<Plan>(PATHS.plan, json("POST", { ...input, lang: locale })),
    () => local.savePlan(input, locale),
  );
}

export function rebuildPlan(locale: string, input?: PlanInput): Promise<Plan> {
  return orLocal(
    () => api<Plan>(PATHS.planRebuild, json("POST", { lang: locale, ...(input ?? {}) })),
    () => local.rebuildPlan(locale, input),
  );
}

// ---------- Scan & diary ----------

export function scanPhoto(file: Blob, locale: string): Promise<ScanResult> {
  const body = new FormData();
  body.append("file", file, "plate.jpg");
  body.append("lang", locale);
  return api<ScanResult>(PATHS.scan, { method: "POST", body }).then((r) => {
    local.noteScan();
    return r;
  });
}

export function listMeals(day = today()): Promise<Meal[]> {
  return api<Meal[]>(`${PATHS.meals}?day=${day}`);
}

export function addMeal(meal: MealInput, day = today()): Promise<Meal> {
  return api<Meal>(PATHS.meals, json("POST", { day, ...roundMacros(meal) }));
}

export function deleteMeal(id: number): Promise<void> {
  return api<void>(`${PATHS.meals}/${id}`, { method: "DELETE" });
}

export function mealTotals(start: string, end: string): Promise<DayTotals[]> {
  return api<DayTotals[]>(`${PATHS.mealTotals}?start=${start}&end=${end}`);
}

export function addWater(ml: number, day = today()): Promise<{ value: number }> {
  return api<{ value: number }>(PATHS.water, json("POST", { day, delta: ml }));
}

export async function waterToday(day = today()): Promise<number> {
  const rows = await api<{ day: string; value: number }[]>(`/metrics/water_ml?start=${day}&end=${day}`).catch(() => []);
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
  return api<WeightTrend>(`${PATHS.weightTrend}?span=${span}`);
}

export function fetchBmi(locale: string): Promise<Bmi | null> {
  return orLocal(
    () => api<Bmi>(PATHS.bmi),
    async () => {
      const plan = await local.loadPlan(locale);
      const trend = await weightTrend(365).catch(() => null);
      return plan ? local.bmiFromPlan(plan, trend?.latest_kg ?? undefined) : null;
    },
  );
}

// ---------- Coach ----------

export function dailyTip(locale: string): Promise<DailyTip> {
  return orLocal(
    () => api<DailyTip>(`${PATHS.dailyTip}?lang=${locale}`),
    () => local.dailyTip(locale),
  );
}

export function chat(messages: ChatMessage[], locale: string): Promise<ChatMessage> {
  return orLocal(
    async () => {
      const r = await api<{ reply: string } | ChatMessage>(PATHS.chat, json("POST", { messages, lang: locale }));
      return "reply" in r ? { role: "assistant" as const, content: r.reply } : r;
    },
    () => ({ role: "assistant" as const, content: local.offlineReply(locale) }),
  );
}

// ---------- Progress ----------

export function listMeasurements(): Promise<Measurement[]> {
  return orLocal(() => api<Measurement[]>(PATHS.measurements), local.measurements.list);
}

export function addMeasurement(m: MeasurementInput): Promise<Measurement> {
  return orLocal(() => api<Measurement>(PATHS.measurements, json("POST", m)), () => local.measurements.add(m));
}

export function listPhotos(): Promise<ProgressPhoto[]> {
  return orLocal(() => api<ProgressPhoto[]>(PATHS.photos), local.photos.list);
}

export function uploadPhoto(file: Blob, kind: ProgressPhoto["kind"], day = today()): Promise<ProgressPhoto> {
  const body = new FormData();
  body.append("file", file, "progress.jpg");
  body.append("kind", kind);
  body.append("day", day);
  return orLocal(
    () => api<ProgressPhoto>(PATHS.photos, { method: "POST", body }),
    () => local.photos.add(file, kind, day),
  );
}

export function deletePhoto(id: ProgressPhoto["id"]): Promise<void> {
  return orLocal(() => api<void>(`${PATHS.photos}/${id}`, { method: "DELETE" }), () => local.photos.remove(id));
}

export function listWorkouts(): Promise<WorkoutLog[]> {
  return orLocal(() => api<WorkoutLog[]>(PATHS.workouts), local.workouts.list);
}

export function logWorkout(title: string, day = today()): Promise<WorkoutLog> {
  return orLocal(() => api<WorkoutLog>(PATHS.workouts, json("POST", { day, title })), () => local.workouts.add(title, day));
}

export function deleteWorkout(id: WorkoutLog["id"]): Promise<void> {
  return orLocal(() => api<void>(`${PATHS.workouts}/${id}`, { method: "DELETE" }), () => local.workouts.remove(id));
}

// ---------- Achievements ----------

export function fetchAchievements(): Promise<Achievements> {
  return orLocal(
    () => api<Achievements>(PATHS.achievements),
    async () => {
      const end = today();
      const start = local.isoDay(local.addDays(new Date(), -59));
      const [totals, trend, workouts, plan] = await Promise.all([
        mealTotals(start, end).catch(() => [] as DayTotals[]),
        weightTrend(365).catch(() => null),
        local.workouts.list(),
        local.loadPlan("en"),
      ]);
      const water = await api<{ day: string; value: number }[]>(`/metrics/water_ml?start=${start}&end=${end}`).catch(() => []);
      return local.achievements({ totals, trend, workouts, plan, water });
    },
  );
}
