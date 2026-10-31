"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Logo from "@/components/landing/Logo";
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
    "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-glow caret-coral placeholder:text-mist/70 outline-none transition-colors duration-300 focus:border-peach/60 focus:bg-white/[0.09]";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-plum px-4 text-glow">
      <div className="hero-glow absolute inset-0 -z-0" aria-hidden="true" />
      <Link href="/" aria-label="VitaPulse home" className="relative mb-8 rounded-full">
        <Logo />
      </Link>
      <form onSubmit={onSubmit} className="glass-card relative w-full max-w-sm space-y-4 rounded-[28px] p-7">
        <h1 className="font-serif text-3xl tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        {mode === "register" && (
          <input className={input} aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" required aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required minLength={8} aria-label="Password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-coral">{error}</p>}
        <button disabled={busy} className="btn-warm w-full rounded-full py-3 font-semibold disabled:opacity-60">
          {busy ? "..." : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        <p className="text-center text-sm text-mist">
          {mode === "login" ? (
            <Link href="/register" className="text-peach underline-offset-4 hover:underline">Need an account? Sign up</Link>
          ) : (
            <Link href="/login" className="text-peach underline-offset-4 hover:underline">Already registered? Sign in</Link>
          )}
        </p>
      </form>
    </main>
  );
}
