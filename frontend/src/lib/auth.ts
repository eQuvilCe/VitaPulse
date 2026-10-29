import { api, setToken } from "./api";

export type User = {
  id: number;
  email: string;
  name: string;
  language: "ru" | "uz" | "en";
  created_at: string;
};

export async function login(email: string, password: string): Promise<void> {
  const body = new URLSearchParams({ username: email, password });
  const data = await api<{ access_token: string }>("/auth/login", { method: "POST", body });
  setToken(data.access_token);
}

export async function register(email: string, password: string, name: string): Promise<void> {
  await api<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  await login(email, password);
}

export function logout(): void {
  setToken(null);
}

export function fetchMe(): Promise<User> {
  return api<User>("/auth/me");
}
