const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const TOKEN_KEY = "vitapulse_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function errorMessage(detail: unknown): string | undefined {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d?.msg === "string" ? d.msg : "Invalid input")).join("; ");
  }
  return undefined;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, errorMessage(data?.detail) ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
