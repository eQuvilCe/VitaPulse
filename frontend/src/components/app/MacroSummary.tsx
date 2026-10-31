"use client";

import { Progress } from "@/components/ui";
import type { Macros } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { fmt, formatNumber, useAppT } from "./i18n";

// Calorie ring: eaten against the target, the centre shows what is left.
export function CalorieRing({ eaten, target, size = 168 }: { eaten: number; target: number; size?: number }) {
  const { t, locale } = useAppT();
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, eaten / target) : 0;
  const over = target > 0 && eaten > target;
  const left = Math.round(target - eaten);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-kcal-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cx("transition-[stroke-dashoffset] duration-700 ease-out", over ? "stroke-danger" : "stroke-kcal-500")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[28px] font-semibold leading-none tabular-nums text-fg">{formatNumber(Math.abs(left), locale)}</span>
        <span className="mt-1 text-caption text-fg-muted">
          {t.common.kcal} {over ? t.diary.over : t.diary.left}
        </span>
      </div>
      <span className="sr-only">
        {formatNumber(eaten, locale)} {fmt(t.diary.of, { n: formatNumber(target, locale) })} {t.common.kcal}
      </span>
    </div>
  );
}

// Three macro bars. Without `eaten`, shows the plan targets only.
export function MacroBars({ target, eaten, className }: { target: Macros; eaten?: Macros; className?: string }) {
  const { t, locale } = useAppT();
  const rows = [
    { label: t.plan.protein, key: "protein_g" as const },
    { label: t.plan.carbs, key: "carbs_g" as const },
    { label: t.plan.fat, key: "fat_g" as const },
  ];
  return (
    <div className={cx("space-y-3.5", className)}>
      {rows.map(({ label, key }) => {
        const goal = Math.round(target[key]);
        const have = eaten ? Math.round(eaten[key]) : goal;
        return (
          <Progress
            key={key}
            label={label}
            showLabel
            tone={key === "protein_g" ? "brand" : "calorie"}
            value={have}
            max={goal}
            valueText={
              eaten
                ? `${formatNumber(have, locale)} / ${formatNumber(goal, locale)} ${t.common.g}`
                : `${formatNumber(goal, locale)} ${t.common.g}`
            }
          />
        );
      })}
    </div>
  );
}

export function MacroLine({ m, className }: { m: Macros; className?: string }) {
  const { t, locale } = useAppT();
  return (
    <span className={cx("tabular-nums text-caption text-fg-muted", className)}>
      {formatNumber(m.calories, locale)} {t.common.kcal} · {t.common.p} {formatNumber(m.protein_g, locale)} · {t.common.c}{" "}
      {formatNumber(m.carbs_g, locale)} · {t.common.f} {formatNumber(m.fat_g, locale)}
    </span>
  );
}
