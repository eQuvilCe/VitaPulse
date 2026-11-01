import { api } from "./api";

export type MetricKind = "water_ml" | "steps" | "weight_kg" | "mood";

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addMetric(kind: MetricKind, delta: number, day = today()): Promise<unknown> {
  return api(`/metrics/${kind}/add`, { method: "POST", body: JSON.stringify({ day, delta }) });
}

export function setMetric(kind: MetricKind, value: number, day = today()): Promise<unknown> {
  return api(`/metrics/${kind}`, { method: "PUT", body: JSON.stringify({ day, value }) });
}
