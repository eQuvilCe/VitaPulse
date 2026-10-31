// The questionnaire draft: filled on the landing, /signup or /onboarding, kept in
// the browser until the user has an account and the plan is built.

import type { Activity, GoalKind, Place, PlanInput, Restriction, Sex } from "@/lib/api-vita";

export type Draft = Partial<PlanInput>;

const KEY = "vh-plan-draft";

const RESTRICTIONS: Restriction[] = ["vegetarian", "vegan", "no_lactose", "no_gluten", "no_pork", "no_nuts", "no_fish"];

export function loadDraft(): Draft {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Draft;
  } catch {
    return {};
  }
}

export function saveDraft(draft: Draft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Not kept between visits.
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

function num(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function pick(q: URLSearchParams, ...names: string[]): string | null {
  for (const n of names) {
    const v = q.get(n);
    if (v) return v;
  }
  return null;
}

// Reads questionnaire answers from a query string. Accepts a few spellings so the
// landing form can pass `height=180&weight=82&goal=lose&kg=6` or the API field names.
export function draftFromQuery(q: URLSearchParams): Draft {
  const d: Draft = {};
  const height = num(pick(q, "height_cm", "height", "h"));
  const weight = num(pick(q, "weight_kg", "weight", "w"));
  const age = num(pick(q, "age"));
  if (height) d.height_cm = height;
  if (weight) d.weight_kg = weight;
  if (age) d.age = Math.round(age);

  const sex = pick(q, "sex", "gender");
  if (sex === "male" || sex === "m") d.sex = "male" as Sex;
  if (sex === "female" || sex === "f") d.sex = "female" as Sex;

  let change = num(pick(q, "target_change_kg", "change", "kg", "delta", "target_kg"));
  const rawGoal = pick(q, "goal");
  // A signed change like `delta=-6` also tells the direction.
  const signed = Number(pick(q, "delta", "change") ?? NaN);
  if (!change && Number.isFinite(signed) && signed !== 0) change = Math.abs(signed);
  let goal: GoalKind | undefined;
  if (rawGoal === "lose" || rawGoal === "gain" || rawGoal === "maintain") goal = rawGoal;
  else if (Number.isFinite(signed) && signed !== 0) goal = signed < 0 ? "lose" : "gain";
  if (goal) d.goal = goal;
  if (change) d.target_change_kg = change;

  const target = pick(q, "target_weight", "target_weight_kg");
  if (target && weight && !change) {
    const diff = Number(target) - weight;
    if (Number.isFinite(diff) && diff !== 0) {
      d.target_change_kg = Math.abs(Math.round(diff * 10) / 10);
      d.goal = d.goal ?? (diff < 0 ? "lose" : "gain");
    }
  }

  const date = pick(q, "target_date", "date", "by");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) d.target_date = date;

  const activity = pick(q, "activity");
  if (activity && ["sedentary", "light", "moderate", "active"].includes(activity)) d.activity = activity as Activity;

  const place = pick(q, "place", "train");
  if (place === "home" || place === "gym") d.place = place as Place;

  const restrictions = pick(q, "restrictions", "diet");
  if (restrictions) d.restrictions = restrictions.split(",").filter((r): r is Restriction => RESTRICTIONS.includes(r as Restriction));

  return d;
}

export function isComplete(d: Draft): d is PlanInput {
  return Boolean(
    d.height_cm && d.weight_kg && d.age && d.sex && d.goal && d.target_date && d.activity && d.place &&
      (d.goal === "maintain" || d.target_change_kg),
  );
}

export function withDefaults(d: Draft): PlanInput {
  const inThreeMonths = new Date();
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);
  const iso = inThreeMonths.toISOString().slice(0, 10);
  return {
    height_cm: d.height_cm ?? 0,
    weight_kg: d.weight_kg ?? 0,
    age: d.age ?? 0,
    sex: d.sex ?? "female",
    goal: d.goal ?? "lose",
    target_change_kg: d.goal === "maintain" ? 0 : (d.target_change_kg ?? 5),
    target_date: d.target_date ?? iso,
    activity: d.activity ?? "light",
    place: d.place ?? "home",
    restrictions: d.restrictions ?? [],
  };
}

export { RESTRICTIONS };
