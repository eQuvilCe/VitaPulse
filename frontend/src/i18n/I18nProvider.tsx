"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import en, { type Dictionary } from "./en";
import ru from "./ru";

export const LOCALES = ["en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

const dictionaries: Record<Locale, Dictionary> = { en, ru };
const STORAGE_KEY = "vh-locale";

type I18n = { locale: Locale; setLocale: (locale: Locale) => void; t: Dictionary };

const I18nContext = createContext<I18n | null>(null);

function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

// Renders English on the server, then switches to the saved or browser
// language after hydration.
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage can be blocked; fall back to the browser language.
    }
    if (isLocale(saved)) setLocaleState(saved);
    else if (navigator.language.toLowerCase().startsWith("ru")) setLocaleState("ru");
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted, still applied for this visit.
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
