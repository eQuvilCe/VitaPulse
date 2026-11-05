"use client";

import { useI18n } from "@/i18n/I18nProvider";

import en, { type AppDictionary } from "./en";
import ru from "./ru";

const dictionaries: Record<string, AppDictionary> = { en, ru };

// Cabinet copy for the current locale, plus a tiny `{name}` formatter.
export function useAppT() {
  const { locale, setLocale } = useI18n();
  return { t: dictionaries[locale] ?? en, locale, setLocale };
}

export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function formatDate(iso: string, locale: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", opts);
}

export function formatNumber(n: number, locale: string, digits = 0): string {
  return n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: digits });
}
