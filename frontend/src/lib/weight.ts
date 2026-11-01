import { api } from "./api";
import { today } from "./habits";

export type WeightTrend = {
  points: { day: string; weight_kg: number }[];
  latest_kg: number | null;
  change_kg: number | null;
};

export function fetchWeightTrend(span = 30): Promise<WeightTrend> {
  return api<WeightTrend>(`/stats/weight?end=${today()}&span=${span}`);
}
