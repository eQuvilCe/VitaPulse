import { api } from "./api";

export type Goals = {
  sleep_minutes: number;
  water_ml: number;
  steps: number;
  calories: number;
};

export type Score = {
  total: number;
  sleep: number;
  water: number;
  steps: number;
  habits: number;
};

export type Dashboard = {
  day: string;
  sleep_minutes: number | null;
  water_ml: number;
  steps: number;
  weight_kg: number | null;
  mood: number | null;
  calories: number;
  habits_done: number;
  habits_total: number;
  goals: Goals;
  // older API builds do not send a score
  score?: Score;
  tips: string[];
};

export function fetchDashboard(): Promise<Dashboard> {
  return api<Dashboard>("/dashboard");
}
