import { api } from "./api";

export type Achievements = {
  unlocked: string[];
  locked: string[];
};

export const BADGE_TEXT: Record<string, string> = {
  first_meal: "First meal logged",
  sleep_3: "3 nights on target",
  sleep_7: "A full week of sleep goals",
  water_3: "3 days of hydration",
  water_7: "Hydrated for a week",
  steps_3: "3 active days in a row",
  steps_7: "A week of step goals",
  habits_7: "7 days of habits",
  habits_30: "A month of habits",
};

export function badgeText(code: string): string {
  return BADGE_TEXT[code] ?? code;
}

export function fetchAchievements(): Promise<Achievements> {
  return api<Achievements>("/achievements");
}
