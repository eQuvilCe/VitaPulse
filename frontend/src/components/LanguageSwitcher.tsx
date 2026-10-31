"use client";

import { LOCALES, useI18n } from "@/i18n/I18nProvider";
import { cx } from "@/lib/cx";

// Compact EN / RU segmented toggle. `onDark` fits the landing's night navbar.
export default function LanguageSwitcher({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className={cx(
        "inline-flex items-center rounded-full p-0.5 text-[12px] font-bold tracking-wide",
        onDark ? "bg-white/[0.07] ring-1 ring-inset ring-white/10" : "bg-subtle ring-1 ring-inset ring-line",
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            onClick={() => setLocale(l)}
            aria-pressed={active}
            title={t.language[l]}
            className={cx(
              "rounded-full px-2.5 py-1 uppercase transition-colors duration-300",
              onDark
                ? active
                  ? "bg-white/15 text-glow"
                  : "text-mist hover:text-glow"
                : active
                  ? "bg-surface text-fg shadow-card"
                  : "text-fg-muted hover:text-fg",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
