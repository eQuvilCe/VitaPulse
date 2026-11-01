import { api } from "./api";

export type Habit = {
  id: number;
  name: string;
  done_today: boolean;
  current_streak: number;
  longest_streak: number;
};

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fetchHabits(): Promise<Habit[]> {
  return api<Habit[]>(`/habits?today=${today()}`);
}

export function createHabit(name: string): Promise<Habit> {
  return api<Habit>("/habits", { method: "POST", body: JSON.stringify({ name }) });
}

export function setDone(id: number, done: boolean): Promise<void> {
  const day = today();
  return done
    ? api<void>(`/habits/${id}/checkins`, { method: "POST", body: JSON.stringify({ day }) })
    : api<void>(`/habits/${id}/checkins/${day}`, { method: "DELETE" });
}

export function archiveHabit(id: number): Promise<void> {
  return api<void>(`/habits/${id}`, { method: "DELETE" });
}
