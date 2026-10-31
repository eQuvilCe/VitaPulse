"use client";

import { Camera, ChevronLeft, ChevronRight, Droplets, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonClasses, Card, Input, Progress } from "@/components/ui";
import { addDays, isoDay } from "@/lib/api-fallback";
import { addMeal, addWater, deleteMeal, fetchPlan, listMeals, today, waterToday, type Macros, type Meal, type MealInput } from "@/lib/api-vita";

import { fmt, formatDate, formatNumber, useAppT } from "./i18n";
import { CalorieRing, MacroBars, MacroLine } from "./MacroSummary";
import { ErrorBlock, LoadingBlock, PageHeader, SectionTitle, useLoad } from "./states";

const WATER_GOAL = 2000;
const EMPTY: MealInput = { name: "", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export default function DiaryView() {
  const { t, locale } = useAppT();
  const [day, setDay] = useState(today());
  const meals = useLoad(() => listMeals(day), [day]);
  const plan = useLoad(() => fetchPlan(locale), [locale]);
  const water = useLoad(() => waterToday(day), [day]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<MealInput>(EMPTY);
  const [busy, setBusy] = useState(false);

  const list = meals.data ?? [];
  const eaten: Macros = list.reduce(
    (a, m) => ({ calories: a.calories + m.calories, protein_g: a.protein_g + m.protein_g, carbs_g: a.carbs_g + m.carbs_g, fat_g: a.fat_g + m.fat_g }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  const target: Macros | null = plan.data ?? null;
  const isToday = day === today();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.calories) return;
    setBusy(true);
    try {
      const saved = await addMeal({ ...draft, name: draft.name.trim() }, day);
      meals.setData([...list, saved]);
      setDraft(EMPTY);
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: Meal) {
    meals.setData(list.filter((x) => x.id !== m.id));
    try {
      await deleteMeal(m.id);
    } catch {
      meals.reload();
    }
  }

  async function drink() {
    const prev = water.data ?? 0;
    water.setData(prev + 250);
    try {
      const r = await addWater(250, day);
      water.setData(r.value);
    } catch {
      water.setData(prev);
    }
  }

  const shift = (n: number) => setDay(isoDay(addDays(new Date(`${day}T12:00:00`), n)));
  const num = (key: Exclude<keyof MealInput, "name">, label: string, suffix: string) => (
    <Input
      label={label}
      suffix={suffix}
      inputMode="decimal"
      value={draft[key] ? String(draft[key]) : ""}
      onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value.replace(",", ".")) || 0 }))}
    />
  );

  return (
    <>
      <PageHeader
        title={t.diary.title}
        actions={
          <div className="flex items-center gap-1 rounded-full bg-surface p-1 shadow-card ring-1 ring-inset ring-line">
            <button type="button" onClick={() => shift(-1)} aria-label={t.diary.prev} className="rounded-full p-2 text-fg-muted hover:bg-subtle hover:text-fg">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[132px] text-center text-caption font-semibold" aria-live="polite">
              {isToday ? t.diary.today : formatDate(day, locale, { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              disabled={isToday}
              aria-label={t.diary.next}
              className="rounded-full p-2 text-fg-muted hover:bg-subtle hover:text-fg disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      {meals.error ? (
        <ErrorBlock onRetry={meals.reload} />
      ) : meals.loading && !meals.data ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
              <CalorieRing eaten={eaten.calories} target={target?.calories ?? 0} />
              <div className="w-full flex-1">
                <p className="text-caption text-fg-muted">
                  <span className="text-heading tabular-nums text-fg">{formatNumber(eaten.calories, locale)}</span> {t.common.kcal} {t.diary.eaten}
                  {target && <> · {fmt(t.diary.of, { n: formatNumber(target.calories, locale) })}</>}
                </p>
                {target ? (
                  <MacroBars target={target} eaten={eaten} className="mt-4" />
                ) : (
                  <p className="mt-3 text-caption text-fg-muted">
                    <Link href="/onboarding" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                      {t.diary.noPlan}
                    </Link>
                  </p>
                )}
              </div>
            </Card>

            <Card tone="subtle" className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-soft text-info" aria-hidden="true">
                <Droplets className="h-5 w-5" />
              </span>
              <Progress
                className="flex-1"
                label={t.diary.water}
                showLabel
                value={water.data ?? 0}
                max={WATER_GOAL}
                valueText={`${formatNumber(water.data ?? 0, locale)} / ${formatNumber(WATER_GOAL, locale)} ${t.common.ml}`}
              />
              <Button size="sm" variant="secondary" onClick={drink}>
                {t.diary.addWater}
              </Button>
            </Card>
          </div>

          <Card className="lg:col-span-3">
            <SectionTitle
              aside={
                <div className="flex gap-2">
                  <Link href="/scan" className={buttonClasses({ variant: "calorie", size: "sm" })}>
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.diary.scan}</span>
                  </Link>
                  <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.diary.add}</span>
                  </Button>
                </div>
              }
            >
              {isToday ? t.diary.today : formatDate(day, locale, { day: "numeric", month: "long" })}
            </SectionTitle>

            {adding && (
              <form onSubmit={submit} className="mb-4 space-y-3 rounded-card bg-canvas p-4 ring-1 ring-inset ring-line">
                <Input label={t.diary.name} required autoFocus value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {num("calories", t.scan.calories, t.common.kcal)}
                  {num("protein_g", t.plan.protein, t.common.g)}
                  {num("carbs_g", t.plan.carbs, t.common.g)}
                  {num("fat_g", t.plan.fat, t.common.g)}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busy || !draft.name.trim() || !draft.calories}>
                    {t.diary.save}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            )}

            {list.length === 0 ? (
              <p className="py-10 text-center text-body text-fg-muted">{t.diary.empty}</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold">{m.name}</p>
                      <MacroLine m={m} />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(m)}
                      aria-label={`${t.diary.remove}: ${m.name}`}
                      className="rounded-full p-2 text-fg-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
