const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface Dashboard {
  day: string;
  sleep_minutes: number | null;
  water_ml: number;
  steps: number;
  weight_kg: number | null;
  mood: number | null;
  calories: number;
  habits_done: number;
  habits_total: number;
  tips: string[];
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) throw new Error("Incorrect email or password");
  return (await res.json()).access_token;
}

export async function fetchDashboard(token: string): Promise<Dashboard> {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}
