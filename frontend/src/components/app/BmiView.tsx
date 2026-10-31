"use client";

import { Info } from "lucide-react";
import Link from "next/link";

import { buttonClasses, Card } from "@/components/ui";
import { fetchBmi } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import BmiScale from "./BmiScale";
import { fmt, formatNumber, useAppT } from "./i18n";
import { ErrorBlock, LoadingBlock, PageHeader, useLoad } from "./states";

export default function BmiView() {
  const { t, locale } = useAppT();
  const { data, error, loading, reload } = useLoad(() => fetchBmi(locale), [locale]);

  if (loading && data === undefined) return <LoadingBlock rows={2} />;
  if (error) return <ErrorBlock onRetry={reload} />;

  if (!data) {
    return (
      <>
        <PageHeader title={t.bmi.title} lead={t.bmi.lead} />
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body text-fg-muted">{t.bmi.empty}</p>
          <Link href="/onboarding" className={buttonClasses()}>
            {t.plan.start}
          </Link>
        </Card>
      </>
    );
  }

  const below = data.weight_kg < data.healthy_min_kg;
  const above = data.weight_kg > data.healthy_max_kg;
  const toHealthy = below ? data.healthy_min_kg - data.weight_kg : above ? data.weight_kg - data.healthy_max_kg : 0;

  return (
    <>
      <PageHeader title={t.bmi.title} lead={t.bmi.lead} />

      <Card className="rounded-panel px-5 py-6 sm:px-8">
        <BmiScale data={data} />
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t.bmi.now} value={formatNumber(data.bmi, locale, 1)} sub={`${formatNumber(data.weight_kg, locale, 1)} ${t.common.kg} · ${t.bmi.categories[data.category]}`} />
        {data.target_bmi != null && data.target_weight_kg != null ? (
          <Stat
            tone="brand"
            label={t.bmi.goal}
            value={formatNumber(data.target_bmi, locale, 1)}
            sub={`${formatNumber(data.target_weight_kg, locale, 1)} ${t.common.kg}`}
          />
        ) : (
          <Stat label={t.bmi.goal} value="—" sub={t.onboarding.maintain} />
        )}
        <Stat
          label={fmt(t.bmi.healthy, { h: formatNumber(data.height_cm, locale) })}
          value={`${formatNumber(data.healthy_min_kg, locale, 1)}–${formatNumber(data.healthy_max_kg, locale, 1)}`}
          sub={toHealthy > 0 ? fmt(t.bmi.toHealthy, { n: formatNumber(toHealthy, locale, 1) }) : t.bmi.inRange}
          unit={t.common.kg}
        />
      </div>

      <p className="mt-6 flex max-w-2xl items-start gap-2 text-caption text-fg-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t.bmi.note}
      </p>
    </>
  );
}

function Stat({ label, value, sub, unit, tone }: { label: string; value: string; sub: string; unit?: string; tone?: "brand" }) {
  return (
    <Card tone={tone === "brand" ? "brand" : "surface"}>
      <p className={cx("text-caption font-semibold", tone === "brand" ? "text-brand-800" : "text-fg-muted")}>{label}</p>
      <p className="mt-1 text-title font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-body font-normal text-fg-muted">{unit}</span>}
      </p>
      <p className="mt-1 text-caption text-fg-muted">{sub}</p>
    </Card>
  );
}
