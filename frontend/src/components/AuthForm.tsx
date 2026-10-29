"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { login, register } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-white/10 bg-bg px-3 py-2 outline-none focus:border-accent";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6">
        <h1 className="text-2xl font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h1>
        {mode === "register" && (
          <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-accent py-2 font-medium text-bg disabled:opacity-60">
          {busy ? "..." : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        <p className="text-center text-sm text-slate-400">
          {mode === "login" ? (
            <Link href="/register" className="text-accent">Need an account? Sign up</Link>
          ) : (
            <Link href="/login" className="text-accent">Already registered? Sign in</Link>
          )}
        </p>
      </form>
    </main>
  );
}
