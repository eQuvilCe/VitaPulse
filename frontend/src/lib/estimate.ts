// Instant estimate for the questionnaire preview, while the user is still typing.
// Mirrors backend/app/services/nutrition.py so the preview matches the saved plan;
// the plan itself always comes from the API.

import { addDays, isoDay } from "./dates";

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active";
type Goal = "lose" | "gain" | "maintain";

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

const ACTIVITY_FACTORS: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
const KCAL_PER_KG = 7700;
// Weekly pace in kg: comfortable, upper limit as a share of body weight, absolute cap.
const PACE = { lose: [0.5, 0.01, 1.0], gain: [0.25, 0.005, 0.5] } as const;
const CALORIE_FLOOR: Record<Sex, number> = { female: 1200, male: 1500 };

export function bmiValue(weight: number, height: number): number {
  const m = height / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "underweight";
  if (value < 25) return "normal";
  if (value < 30) return "overweight";
  return "obese";
}

export type Estimate = { calories: number; tdee: number; forecast_date: string | null };

export function estimate(input: {
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: Sex;
  activity: Activity;
  goal: Goal;
  goal_kg: number;
  target_date?: string;
}): Estimate {
  const bmr = Math.round(10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + (input.sex === "male" ? 5 : -161));
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[input.activity]);
  const goalKg = input.goal === "maintain" ? 0 : input.goal_kg;

  let pace = 0;
  if (input.goal !== "maintain" && goalKg > 0) {
    const [comfortable, share, cap] = PACE[input.goal];
    const limit = Math.min(cap, input.weight_kg * share);
    pace = Math.min(comfortable, limit);
    const weeks = input.target_date ? (new Date(`${input.target_date}T00:00:00`).getTime() - Date.now()) / (7 * 864e5) : 0;
    if (weeks > 0) pace = Math.min(goalKg / weeks, limit);
  }

  const delta = (pace * KCAL_PER_KG) / 7;
  const signed = input.goal === "lose" ? -delta : input.goal === "gain" ? delta : 0;
  const calories = Math.max(CALORIE_FLOOR[input.sex], Math.round((tdee + signed) / 10) * 10);

  // The pace the calorie target really gives (the floor can slow it down).
  const weekly = Math.abs(((calories - tdee) * 7) / KCAL_PER_KG);
  const forecast_date = goalKg > 0 && weekly > 0 ? isoDay(addDays(new Date(), Math.round((goalKg / weekly) * 7))) : null;
  return { calories, tdee, forecast_date };
}
