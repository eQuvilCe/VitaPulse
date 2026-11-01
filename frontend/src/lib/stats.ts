import { api } from "./api";
import { today } from "./habits";

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
  return api<Week>(`/stats/week?end=${today()}&span=${span}`);
}

export type Report = {
  start: string;
  end: string;
  days_logged: number;
  goal_hits: { sleep: number; water: number; steps: number };
  best_steps_day: string | null;
  avg_sleep_minutes: number | null;
  avg_steps: number;
  avg_calories: number;
};

export function fetchReport(span = 7): Promise<Report> {
  return api<Report>(`/stats/report?end=${today()}&span=${span}`);
}
