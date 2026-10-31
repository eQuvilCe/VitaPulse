"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { cx } from "@/lib/cx";

export type Theme = "light" | "dark";

// Kept in sync with the inline script in app/layout.tsx, which applies a saved
// choice before first paint so the page never flashes the wrong theme.
export const THEME_STORAGE_KEY = "vh-theme";

const labels = {
  en: { dark: "Switch to dark theme", light: "Switch to light theme" },
  ru: { dark: "Включить тёмную тему", light: "Включить светлую тему" },
};

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

// The theme in effect: an explicit choice, or the system's until one is made.
export function useTheme() {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(savedTheme() ?? systemTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => !savedTheme() && setThemeState(systemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not persisted, still applied for this visit.
    }
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}

// Sun / moon button. Inherits the text colour, so it works on the cream page,
// the dark page and over the hero video alike.
export default function ThemeToggle({ className }: { className?: string }) {
  const { locale } = useI18n();
  const { theme, setTheme } = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = labels[locale][next];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={cx(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-[color-mix(in_srgb,currentColor_30%,transparent)] transition-colors duration-300 hover:border-current",
        className,
      )}
    >
      <Sun
        className={cx("absolute h-[18px] w-[18px] transition-[opacity,transform] duration-500", theme === "dark" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0")}
        aria-hidden="true"
      />
      <Moon
        className={cx("absolute h-[18px] w-[18px] transition-[opacity,transform] duration-500", theme === "light" ? "rotate-0 opacity-100" : "rotate-90 opacity-0")}
        aria-hidden="true"
      />
    </button>
  );
}
