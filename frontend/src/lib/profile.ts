import { api } from "./api";
import type { User } from "./auth";

export type ProfileUpdate = { name?: string; language?: User["language"] };

export function updateProfile(patch: ProfileUpdate): Promise<User> {
  return api<User>("/auth/me", { method: "PATCH", body: JSON.stringify(patch) });
}

export function changePassword(current: string, next: string): Promise<unknown> {
  return api("/auth/password", {
    method: "POST",
    body: JSON.stringify({ current_password: current, new_password: next }),
  });
}
