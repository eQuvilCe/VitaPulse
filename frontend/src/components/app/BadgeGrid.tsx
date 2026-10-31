"use client";

import { Award, CalendarCheck, CalendarHeart, Camera, ClipboardCheck, Droplets, Dumbbell, Flag, Medal, RotateCcw, Scale, Trophy, Utensils, type LucideIcon } from "lucide-react";

import type { Badge, BadgeCode } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { formatNumber, useAppT } from "./i18n";

const ICONS: Record<BadgeCode, LucideIcon> = {
  first_plan: ClipboardCheck,
  first_scan: Camera,
  first_meal: Utensils,
  diary_7: CalendarCheck,
  diary_30: CalendarHeart,
  weight_1: Scale,
  weight_5: Award,
  weight_10: Trophy,
  workouts_10: Dumbbell,
  workouts_50: Medal,
  water_week: Droplets,
  comeback: RotateCcw,
  goal_reached: Flag,
};

export function BadgeTile({ badge, compact = false }: { badge: Badge; compact?: boolean }) {
  const { t, locale } = useAppT();
  const copy = t.achievements.badges[badge.code];
  const Icon = ICONS[badge.code] ?? Award;
  const earned = Boolean(badge.earned_at);
  const pct = badge.target ? Math.min(100, (badge.progress / badge.target) * 100) : 0;

  return (
    <li
      className={cx(
        "flex rounded-card border p-4 transition-colors",
        compact ? "flex-col items-center gap-2 text-center" : "items-start gap-4",
        earned ? "border-brand-100 bg-brand-50" : "border-line bg-surface",
      )}
    >
      <span
        className={cx(
          "flex shrink-0 items-center justify-center rounded-full",
          compact ? "h-12 w-12" : "h-14 w-14",
          earned ? "bg-gradient-to-br from-brand-300 to-brand-600 text-white shadow-card" : "bg-subtle text-fg-subtle",
        )}
        aria-hidden="true"
      >
        <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cx("font-semibold", compact ? "text-caption" : "text-body", earned ? "text-fg" : "text-fg-muted")}>{copy.name}</p>
        {!compact && <p className="mt-0.5 text-caption text-fg-muted">{copy.desc}</p>}
        {!compact && !earned && badge.target > 1 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-fg-subtle">
              {formatNumber(badge.progress, locale, 1)}/{badge.target}
            </span>
          </div>
        )}
        <span className="sr-only">{earned ? t.achievements.earned : t.achievements.locked}</span>
      </div>
    </li>
  );
}

export default function BadgeGrid({ badges, compact = false }: { badges: Badge[]; compact?: boolean }) {
  const sorted = [...badges].sort((a, b) => Number(Boolean(b.earned_at)) - Number(Boolean(a.earned_at)));
  return (
    <ul className={cx("grid gap-3", compact ? "grid-cols-3 sm:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {sorted.map((b) => (
        <BadgeTile key={b.code} badge={b} compact={compact} />
      ))}
    </ul>
  );
}
