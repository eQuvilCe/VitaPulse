import type { Reminder, ReminderInput } from "./reminders";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function call<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api/v1/reminders${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed with ${res.status}`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const remindersApi = {
  list: (token: string) => call<Reminder[]>("", token),
  create: (token: string, body: ReminderInput) =>
    call<Reminder>("", token, { method: "POST", body: JSON.stringify(body) }),
  update: (token: string, id: number, body: Partial<ReminderInput>) =>
    call<Reminder>(`/${id}`, token, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (token: string, id: number) => call<void>(`/${id}`, token, { method: "DELETE" }),
};
