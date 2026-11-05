import { api } from "./api";

export type DayStats = {
  day: string;
  sleep_minutes: number | null;
  water_ml: number;
  steps: number;
  weight_kg: number | null;
  mood: number | null;
  calories: number;
};

export type Week = {
  days: DayStats[];
  avg_sleep_minutes: number | null;
  avg_steps: number;
};

export function fetchWeek(span = 7): Promise<Week> {
  return api<Week>(`/stats/week?span=${span}`);
}
