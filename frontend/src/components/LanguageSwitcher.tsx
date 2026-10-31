"use client";

import { LOCALES, useI18n } from "@/i18n/I18nProvider";
import { cx } from "@/lib/cx";

// Compact EN / RU toggle. It inherits the text colour, so it fits the cream
// page, the dark theme and the hero video alike. `onDark` is kept for older
// call sites and no longer changes anything.
export default function LanguageSwitcher({ className }: { onDark?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className={cx(
        "inline-flex h-10 items-center gap-0.5 rounded-card border border-[color-mix(in_srgb,currentColor_30%,transparent)] p-1 text-[13px] font-medium",
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
              "h-full rounded-[14px] px-2.5 uppercase transition-[background-color,color,opacity] duration-300",
              active ? "bg-[color-mix(in_srgb,currentColor_14%,transparent)]" : "opacity-60 hover:opacity-100",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
