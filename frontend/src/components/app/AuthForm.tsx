"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card, Input } from "@/components/ui";
import { ApiError, createPlan, googleEnabled, googleLoginUrl, login, register } from "@/lib/api-vita";

import { clearDraft, draftFromQuery, isComplete, loadDraft, saveDraft } from "./draft";
import { useAppT } from "./i18n";

// Builds the plan from a finished questionnaire right after sign-in, then opens it.
export async function finishWithDraft(locale: string): Promise<string | null> {
  const draft = loadDraft();
  if (!isComplete(draft)) return Object.keys(draft).length ? "/onboarding" : null;
  try {
    await createPlan(draft, locale);
    clearDraft();
    return "/plan";
  } catch {
    return "/onboarding";
  }
}

function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t, locale } = useAppT();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error") === "google" ? t.auth.googleFailed : null);
  const [busy, setBusy] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  // Google sign-in stays hidden until the backend has it configured.
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    googleEnabled().then(setGoogle);
  }, []);

  // /signup?height=..&weight=.. carries answers from the landing questionnaire.
  useEffect(() => {
    const fromQuery = draftFromQuery(new URLSearchParams(params.toString()));
    if (Object.keys(fromQuery).length) saveDraft({ ...loadDraft(), ...fromQuery });
    setHasDraft(Object.keys(loadDraft()).length > 0);
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name, locale);
      const target = (await finishWithDraft(locale)) ?? next ?? (mode === "signup" ? "/onboarding" : "/plan");
      router.replace(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
      setBusy(false);
    }
  }

  const query = params.toString();
  const switchHref = `${mode === "login" ? "/signup" : "/login"}${query ? `?${query}` : ""}`;

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6 text-center">
        <h1 className="text-title font-semibold">{mode === "login" ? t.auth.loginTitle : t.auth.signupTitle}</h1>
        <p className="mt-2 text-body text-fg-muted">{mode === "login" ? t.auth.loginLead : t.auth.signupLead}</p>
      </div>

      {hasDraft && mode === "signup" && (
        <div className="mb-4 flex items-start gap-3 rounded-card bg-brand-50 px-4 py-3 text-caption text-brand-800 ring-1 ring-inset ring-brand-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          {t.auth.draftSaved}
        </div>
      )}

      <Card className="space-y-5 rounded-panel p-6 sm:p-7">
        {google && (
          <>
            <a
              href={googleLoginUrl(next ?? "/plan")}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-surface text-body font-semibold text-fg transition-colors hover:border-fg-subtle hover:bg-subtle focus-visible:outline-none focus-visible:shadow-focus"
            >
              <GoogleIcon />
              {t.auth.google}
            </a>

            <div className="flex items-center gap-3 text-caption text-fg-subtle">
              <span className="h-px flex-1 bg-line" />
              {t.auth.or}
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
          {mode === "signup" && <Input label={t.auth.name} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
          <Input label={t.auth.email} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label={t.auth.password}
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            hint={mode === "signup" ? t.auth.passwordHint : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-field bg-danger-soft px-3 py-2 text-caption text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? t.common.loading : mode === "login" ? t.auth.login : t.auth.signup}
          </Button>
        </form>
        {mode === "signup" && <p className="text-center text-caption text-fg-subtle">{t.auth.terms}</p>}
      </Card>

      <p className="mt-6 text-center text-body text-fg-muted">
        {mode === "login" ? t.auth.toSignup : t.auth.toLogin}{" "}
        <Link href={switchHref} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
          {mode === "login" ? t.auth.toSignupLink : t.auth.toLoginLink}
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}
