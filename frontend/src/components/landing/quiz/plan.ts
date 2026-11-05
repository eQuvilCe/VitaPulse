// Client-side estimates for the landing questionnaire. The real plan is built
// by the backend after sign-up; these numbers only preview it.

export type Sex = "female" | "male";
export type Goal = "lose" | "gain";
export type Activity = "low" | "moderate" | "high";

export type Answers = {
  sex: Sex;
  age: number;
  height: number; // cm
  weight: number; // kg
  goal: Goal;
  goalKg: number;
  activity: Activity;
};

export type BmiCategory = "under" | "normal" | "over" | "obese";

export const LIMITS = {
  age: [14, 90],
  height: [120, 230],
  weight: [35, 300],
  goalKg: [1, 40],
} as const;

const ACTIVITY_FACTOR: Record<Activity, number> = { low: 1.2, moderate: 1.45, high: 1.7 };
// kg per week: gentle enough to keep muscle when cutting and limit fat when bulking.
const PACE: Record<Goal, number> = { lose: 0.5, gain: 0.25 };
const HEALTHY_BMI = [18.5, 24.9] as const;
// The BMI scale drawn on the page.
export const BMI_SCALE = { min: 15, max: 40, bands: [18.5, 25, 30] } as const;

export const inRange = (v: number, [lo, hi]: readonly [number, number]) => Number.isFinite(v) && v >= lo && v <= hi;

export function bmiOf(weight: number, height: number) {
  const m = height / 100;
  return weight / (m * m);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "over";
  return "obese";
}

const round = (v: number, step = 1) => Math.round(v / step) * step;

export function estimate(a: Answers, today = new Date()) {
  const m2 = (a.height / 100) ** 2;
  const healthy = { min: round(HEALTHY_BMI[0] * m2), max: round(HEALTHY_BMI[1] * m2) };

  // Losing below the healthy range is not offered: aim for its lower bound instead.
  let target = a.goal === "lose" ? a.weight - a.goalKg : a.weight + a.goalKg;
  const lowTarget = a.goal === "lose" && target < healthy.min;
  if (lowTarget) target = Math.min(a.weight, healthy.min);
  const delta = Math.abs(target - a.weight);

  // Mifflin–St Jeor resting energy, scaled by activity.
  const bmr = 10 * a.weight + 6.25 * a.height - 5 * a.age + (a.sex === "male" ? 5 : -161);
  const maintenance = bmr * ACTIVITY_FACTOR[a.activity];
  const floor = a.sex === "male" ? 1500 : 1200;
  const kcal =
    delta === 0
      ? maintenance
      : a.goal === "lose"
        ? Math.max(Math.min(floor, maintenance), maintenance - 500)
        : maintenance + 300;

  // Protein by body weight, a quarter of energy from fat, carbs fill the rest.
  const protein = a.weight * (a.goal === "lose" ? 1.8 : 1.6);
  const fat = (kcal * 0.25) / 9;
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);

  const weeks = delta > 0 ? Math.max(1, Math.ceil(delta / PACE[a.goal])) : 0;
  const date = new Date(today);
  date.setDate(date.getDate() + weeks * 7);

  return {
    bmi: bmiOf(a.weight, a.height),
    targetBmi: bmiOf(target, a.height),
    healthy,
    target: round(target, 0.5),
    lowTarget,
    maintenance: round(maintenance, 10),
    kcal: round(kcal, 10),
    macros: { protein: round(protein), fat: round(fat), carbs: round(carbs) },
    weeks,
    date,
  };
}

export type Estimate = ReturnType<typeof estimate>;

// Query string handed to sign-up so the account starts from these answers.
export function signupQuery(a: Answers, e: Estimate) {
  return new URLSearchParams({
    sex: a.sex,
    age: String(a.age),
    height: String(a.height),
    weight: String(a.weight),
    goal: a.goal,
    goalKg: String(a.goalKg),
    activity: a.activity,
    bmi: e.bmi.toFixed(1),
    kcal: String(e.kcal),
  }).toString();
}
