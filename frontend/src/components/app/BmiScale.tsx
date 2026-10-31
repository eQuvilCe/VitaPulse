"use client";

import type { Bmi } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { formatNumber, useAppT } from "./i18n";

const MIN = 15;
const MAX = 40;

const BANDS = [
  { key: "underweight" as const, from: MIN, to: 18.5, cls: "bg-info/70" },
  { key: "normal" as const, from: 18.5, to: 25, cls: "bg-brand-500" },
  { key: "overweight" as const, from: 25, to: 30, cls: "bg-warn" },
  { key: "obese" as const, from: 30, to: MAX, cls: "bg-danger/80" },
];

const pos = (bmi: number) => `${((Math.min(MAX, Math.max(MIN, bmi)) - MIN) / (MAX - MIN)) * 100}%`;

function Marker({ bmi, label, tone, below }: { bmi: number; label: string; tone: "now" | "goal"; below?: boolean }) {
  const { locale } = useAppT();
  return (
    <div className="absolute top-0 h-full -translate-x-1/2" style={{ left: pos(bmi) }}>
      <div
        className={cx(
          "absolute left-1/2 flex -translate-x-1/2 flex-col items-center whitespace-nowrap",
          below ? "top-full mt-11" : "bottom-full mb-2",
        )}
      >
        <span
          className={cx(
            "rounded-full px-2.5 py-1 text-caption font-semibold shadow-card",
            tone === "now" ? "bg-fg text-white" : "bg-surface text-brand-800 ring-1 ring-brand-300",
          )}
        >
          {label} · {formatNumber(bmi, locale, 1)}
        </span>
        {!below && <span className="mt-1 h-2 w-px bg-fg" aria-hidden="true" />}
      </div>
      <span
        className={cx(
          "absolute left-1/2 top-1/2 block h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-card",
          tone === "now" ? "bg-fg" : "bg-brand-300",
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export default function BmiScale({ data }: { data: Bmi }) {
  const { t } = useAppT();
  const h2 = (data.height_cm / 100) ** 2;
  const kgAt = (bmi: number) => Math.round(bmi * h2);

  return (
    <figure>
      <div className={cx("relative px-1 pt-12", data.target_bmi != null ? "pb-24" : "pb-12")}>
        <div className="relative h-3">
          <div className="flex h-full overflow-hidden rounded-full">
            {BANDS.map((b) => (
              <div key={b.key} className={b.cls} style={{ width: `${((b.to - b.from) / (MAX - MIN)) * 100}%` }} />
            ))}
          </div>
          <Marker bmi={data.bmi} label={t.bmi.now} tone="now" />
          <div className="absolute inset-x-0 top-full mt-2 text-caption text-fg-muted" aria-hidden="true">
            {[18.5, 25, 30].map((b) => (
              <span key={b} className="absolute -translate-x-1/2 text-center leading-tight tabular-nums" style={{ left: pos(b) }}>
                {b}
                <span className="block text-[11px] text-fg-subtle">
                  {kgAt(b)} {t.common.kg}
                </span>
              </span>
            ))}
          </div>
          {data.target_bmi != null && <Marker bmi={data.target_bmi} label={t.bmi.goal} tone="goal" below />}
        </div>
      </div>
      <figcaption className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-caption sm:grid-cols-4">
        {BANDS.map((b) => (
          <span key={b.key} className={cx("flex items-center gap-2", data.category === b.key ? "font-semibold text-fg" : "text-fg-muted")}>
            <span className={cx("h-2.5 w-2.5 rounded-full", b.cls)} aria-hidden="true" />
            {t.bmi.categories[b.key]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
