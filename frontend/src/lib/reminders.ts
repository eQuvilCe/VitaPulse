export type ReminderKind = "water" | "sleep" | "steps" | "meal" | "weight" | "mood" | "custom";

export interface Reminder {
  id: number;
  kind: ReminderKind;
  at: string; // "HH:MM:SS"
  days: number[]; // 0 = Monday ... 6 = Sunday
  message: string;
  enabled: boolean;
}

export type ReminderInput = Omit<Reminder, "id">;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function formatTime(at: string): string {
  return at.slice(0, 5);
}

export function describeDays(days: number[]): string {
  if (days.length === 7) return "Every day";
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.join() === "0,1,2,3,4") return "Weekdays";
  if (sorted.join() === "5,6") return "Weekends";
  return sorted.map((d) => WEEKDAYS[d]).join(", ");
}
