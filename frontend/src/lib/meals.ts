import { api } from "./api";
import { today } from "./metrics";

export type MealInput = {
  name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
};

export function addMeal(meal: MealInput, day = today()): Promise<unknown> {
  return api("/meals", { method: "POST", body: JSON.stringify({ day, ...meal }) });
}
