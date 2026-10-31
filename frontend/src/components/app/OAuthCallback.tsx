"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { setToken } from "@/lib/api-vita";

import { finishWithDraft } from "./AuthForm";
import { useAppT } from "./i18n";

// The backend's Google OAuth callback lands here with ?token=... (or #access_token=...).
export default function OAuthCallback() {
  const { t, locale } = useAppT();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token") ?? params.get("access_token") ?? hash.get("access_token") ?? hash.get("token");
    if (!token) {
      router.replace("/login?error=google");
      return;
    }
    setToken(token);
    const next = params.get("next");
    finishWithDraft(locale).then((target) => {
      router.replace(target ?? (next && next.startsWith("/") && !next.startsWith("//") ? next : "/plan"));
    });
    // Runs once per landing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <p className="pt-20 text-body text-fg-muted" aria-live="polite">{t.auth.signingIn}</p>;
}
