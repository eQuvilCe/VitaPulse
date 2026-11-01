import { api } from "./api";
import { today } from "./habits";

export type WeightTrend = {
  points: { day: string; weight_kg: number }[];
  latest_kg: number | null;
  change_kg: number | null;
};

export const WEIGHT_SPAN_DAYS = 30;

export function fetchWeightTrend(span = WEIGHT_SPAN_DAYS): Promise<WeightTrend> {
  return api<WeightTrend>(`/stats/weight?end=${today()}&span=${span}`);
}
