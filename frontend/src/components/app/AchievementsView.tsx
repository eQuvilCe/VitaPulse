"use client";

import { CalendarCheck, Droplets, Dumbbell, Flame } from "lucide-react";

import { Card } from "@/components/ui";
import { fetchAchievements } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import BadgeGrid from "./BadgeGrid";
import { fmt, useAppT } from "./i18n";
import { ErrorBlock, LoadingBlock, PageHeader, SectionTitle, useLoad } from "./states";

export default function AchievementsView() {
  const { t } = useAppT();
  const { data, error, loading, reload } = useLoad(fetchAchievements);

  if (loading && !data) return <LoadingBlock rows={3} />;
  if (error || !data) return <ErrorBlock onRetry={reload} />;

  const earned = data.badges.filter((b) => b.earned_at).length;
  const streaks = [
    { label: t.achievements.diaryStreak, value: data.streaks.diary_days, days: true, icon: CalendarCheck, tone: "kcal" },
    { label: t.achievements.workoutStreak, value: data.streaks.workouts_total, days: false, icon: Dumbbell, tone: "brand" },
    { label: t.achievements.waterStreak, value: data.streaks.water_days, days: true, icon: Droplets, tone: "info" },
  ] as const;

  return (
    <>
      <PageHeader title={t.achievements.title} lead={fmt(t.achievements.count, { n: earned, total: data.badges.length })} />

      <SectionTitle>{t.achievements.streaks}</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {streaks.map(({ label, value, days, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4">
            <span
              className={cx(
                "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                tone === "kcal" ? "bg-kcal-50 text-kcal-600" : tone === "brand" ? "bg-brand-50 text-brand-700" : "bg-info-soft text-info",
              )}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
              {value > 0 && <Flame className="absolute -right-1 -top-1 h-4 w-4 fill-kcal-500 text-kcal-500" />}
            </span>
            <div>
              <p className="text-title font-semibold tabular-nums">{days ? fmt(t.achievements.days, { n: value }) : value}</p>
              <p className="text-caption text-fg-muted">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>{t.profile.badges}</SectionTitle>
      <BadgeGrid badges={data.badges} />
    </>
  );
}
