"use client";

import { useI18n, type Locale } from "@/i18n/I18nProvider";
import en, { type LandingCopy } from "./en";
import ru from "./ru";

const copy: Record<Locale, LandingCopy> = { en, ru };

// Landing copy for the current locale, plus the locale itself for number and date formatting.
export function useCopy() {
  const { locale } = useI18n();
  return { c: copy[locale], locale };
}

// Fills `{name}` placeholders, e.g. fill("{min}–{max} kg", { min: 57, max: 77 }).
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
