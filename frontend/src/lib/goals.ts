import { api } from "./api";
import type { Goals } from "./dashboard";

export function fetchGoals(): Promise<Goals> {
  return api<Goals>("/goals");
}

export function saveGoals(patch: Partial<Goals>): Promise<Goals> {
  return api<Goals>("/goals", { method: "PATCH", body: JSON.stringify(patch) });
}
