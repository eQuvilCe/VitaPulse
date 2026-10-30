import { api } from "./api";
import { today } from "./metrics";

export function logSleep(minutes: number, quality: number, day = today()): Promise<unknown> {
  return api("/sleep", { method: "PUT", body: JSON.stringify({ day, minutes, quality }) });
}
