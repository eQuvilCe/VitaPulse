"use client";

import { CalendarClock, Check, ChevronDown, Clock, ClipboardCopy, Dumbbell, Flame, Pencil, RefreshCw, ShoppingBasket, Sparkles, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge, Button, buttonClasses, Card } from "@/components/ui";
import { fetchPlan, listWorkouts, logWorkout, rebuildPlan, today, type Plan, type PlanMeal, type Workout } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { fmt, formatDate, formatNumber, useAppT } from "./i18n";
import { MacroBars, MacroLine } from "./MacroSummary";
import { ErrorBlock, LoadingBlock, PageHeader, SectionTitle, useLoad } from "./states";

type Tab = "menu" | "shopping" | "workouts";

// Monday-based index of today.
const todayIndex = () => (new Date().getDay() + 6) % 7;

export default function PlanView() {
  const { t, locale } = useAppT();
  const { data: plan, setData, error, loading, reload } = useLoad(() => fetchPlan(locale), [locale]);
  const [rebuilding, setRebuilding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("menu");

  async function rebuild() {
    setRebuilding(true);
    setNotice(null);
    try {
      setData(await rebuildPlan(locale));
      setNotice(t.plan.rebuilt);
    } catch {
      setNotice(t.common.error);
    } finally {
      setRebuilding(false);
    }
  }

  if (loading && !plan) return <LoadingBlock rows={4} />;
  if (error) return <ErrorBlock onRetry={reload} />;
  if (!plan) return <EmptyPlan />;

  const goalWeight = plan.input.goal === "maintain" ? plan.input.weight_kg : plan.input.weight_kg + (plan.input.goal === "lose" ? -1 : 1) * plan.input.target_change_kg;

  return (
    <>
      <PageHeader
        title={t.plan.title}
        lead={fmt(t.plan.source, { date: formatDate(plan.created_at, locale) })}
        actions={
          <>
            <Link href="/onboarding" className={buttonClasses({ variant: "secondary", size: "sm" })}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t.plan.edit}
            </Link>
            <Button size="sm" onClick={rebuild} disabled={rebuilding}>
              <RefreshCw className={cx("h-4 w-4", rebuilding && "animate-spin")} aria-hidden="true" />
              {rebuilding ? t.plan.rebuilding : t.plan.rebuild}
            </Button>
          </>
        }
      />
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
      {notice && (
        <div className="mb-4 rounded-card bg-brand-50 px-4 py-3 text-caption font-semibold text-brand-800 ring-1 ring-inset ring-brand-100" aria-hidden="true">
          {notice}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-caption font-semibold text-fg-muted">{t.plan.daily}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">{formatNumber(plan.calories, locale)}</span>
                <span className="text-body text-fg-muted">{t.common.kcal}</span>
              </p>
              <p className="mt-2 text-caption text-fg-muted">{fmt(t.plan.tdee, { tdee: formatNumber(plan.tdee, locale) })}</p>
            </div>
            <Badge tone={plan.source === "ai" ? "brand" : "neutral"}>
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {plan.source === "ai" ? t.plan.ai : t.plan.formula}
            </Badge>
          </div>
          <MacroBars target={plan} className="mt-6" />
        </Card>

        <Card tone="brand" className="flex flex-col lg:col-span-2">
          <p className="flex items-center gap-2 text-caption font-semibold text-brand-800">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            {t.plan.forecast}
          </p>
          {plan.input.goal === "maintain" ? (
            <p className="mt-3 text-lead text-fg">{fmt(t.plan.forecastMaintain, { target: formatNumber(goalWeight, locale, 1) })}</p>
          ) : (
            <>
              <p className="mt-3 text-body text-fg-muted">
                {fmt(t.plan.forecastLead, {
                  pace: formatNumber(Math.abs(plan.weekly_change_kg), locale, 2),
                  target: formatNumber(goalWeight, locale, 1),
                })}
              </p>
              <p className="mt-1 font-serif text-[34px] leading-tight text-brand-800">{formatDate(plan.forecast_date, locale)}</p>
              {plan.pace_capped && <p className="mt-3 text-caption text-warn-strong">{t.plan.paceCapped}</p>}
            </>
          )}
          <div className="mt-auto flex gap-6 pt-5 text-caption text-fg-muted">
            <span>
              <span className="block text-heading tabular-nums text-fg">{formatNumber(plan.input.weight_kg, locale, 1)}</span>
              {t.common.kg} · {t.bmi.now}
            </span>
            <span>
              <span className="block text-heading tabular-nums text-brand-800">{formatNumber(goalWeight, locale, 1)}</span>
              {t.common.kg} · {t.bmi.goal}
            </span>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <div role="tablist" aria-label={t.plan.title} className="mb-4 inline-flex rounded-full bg-subtle p-1 ring-1 ring-inset ring-line">
          {(
            [
              ["menu", t.plan.menu, UtensilsCrossed],
              ["shopping", t.plan.shopping, ShoppingBasket],
              ["workouts", t.plan.workouts, Dumbbell],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`panel-${key}`}
              onClick={() => setTab(key)}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-caption font-semibold transition-colors sm:px-4",
                tab === key ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg",
              )}
            >
              <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "menu" && <WeekMenu plan={plan} />}
          {tab === "shopping" && <Shopping plan={plan} />}
          {tab === "workouts" && <Workouts plan={plan} />}
        </div>
      </div>
    </>
  );
}

function EmptyPlan() {
  const { t } = useAppT();
  return (
    <>
      <PageHeader title={t.plan.title} />
      <Card className="flex flex-col items-center gap-4 rounded-panel px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-heading">{t.plan.empty}</h2>
          <p className="mx-auto mt-1 max-w-md text-body text-fg-muted">{t.plan.emptyLead}</p>
        </div>
        <Link href="/onboarding" className={buttonClasses({ size: "lg" })}>
          {t.plan.start}
        </Link>
      </Card>
    </>
  );
}

function WeekMenu({ plan }: { plan: Plan }) {
  const { t } = useAppT();
  const [day, setDay] = useState(todayIndex());
  const current = plan.menu.find((d) => d.day === day) ?? plan.menu[0];
  const totals = useMemo(
    () =>
      current.meals.reduce(
        (a, m) => ({ calories: a.calories + m.calories, protein_g: a.protein_g + m.protein_g, carbs_g: a.carbs_g + m.carbs_g, fat_g: a.fat_g + m.fat_g }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      ),
    [current],
  );

  return (
    <div>
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2" role="group" aria-label={t.plan.menu}>
          {plan.menu.map((d) => (
            <button
              key={d.day}
              type="button"
              aria-pressed={d.day === day}
              onClick={() => setDay(d.day)}
              className={cx(
                "flex h-14 min-w-[52px] flex-1 flex-col items-center justify-center rounded-field border text-caption font-semibold transition-colors",
                d.day === day ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line bg-surface text-fg-muted hover:border-line-strong",
              )}
            >
              {t.days.short[d.day]}
              {d.day === todayIndex() && <span className="mt-1 h-1 w-1 rounded-full bg-kcal-500" aria-label={t.common.today} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-heading">{t.days.long[current.day]}</h3>
        <MacroLine m={totals} />
      </div>
      <ul className="space-y-3">
        {current.meals.map((meal, i) => (
          <MealCard key={`${current.day}-${i}`} meal={meal} />
        ))}
      </ul>
    </div>
  );
}

function MealCard({ meal }: { meal: PlanMeal }) {
  const { t } = useAppT();
  const [open, setOpen] = useState(false);
  const id = `recipe-${meal.slot}-${meal.name.replace(/\W+/g, "-")}`;
  return (
    <li className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-subtle/50 sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-kcal-50 text-kcal-600" aria-hidden="true">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-caption font-semibold uppercase tracking-wide text-fg-subtle">{t.slots[meal.slot]}</span>
          <span className="mt-0.5 block text-body font-semibold text-fg">{meal.name}</span>
          <MacroLine m={meal} className="mt-0.5 block" />
        </span>
        <ChevronDown className={cx("h-5 w-5 shrink-0 text-fg-subtle transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="grid gap-5 border-t border-line bg-canvas/60 p-4 sm:grid-cols-2 sm:p-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-caption font-semibold text-fg">
              {t.plan.ingredients}
              <span className="inline-flex items-center gap-1 font-normal text-fg-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {fmt(t.plan.minutes, { n: meal.recipe.minutes })}
              </span>
            </p>
            <ul className="space-y-1.5 text-body text-fg-muted">
              {meal.recipe.ingredients.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-caption font-semibold text-fg">{t.plan.steps}</p>
            <ol className="space-y-2 text-body text-fg-muted">
              {meal.recipe.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-caption font-semibold text-brand-800">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </li>
  );
}

function Shopping({ plan }: { plan: Plan }) {
  const { t } = useAppT();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const groups = useMemo(() => {
    const map = new Map<string, typeof plan.shopping>();
    for (const item of plan.shopping) map.set(item.category, [...(map.get(item.category) ?? []), item]);
    return Array.from(map);
  }, [plan]);

  async function copy() {
    const text = groups.map(([cat, items]) => `${cat}\n${items.map((i) => `- ${i.name}: ${i.amount}`).join("\n")}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; nothing to do.
    }
  }

  return (
    <Card>
      <SectionTitle
        aside={
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
            <span aria-live="polite">{copied ? t.plan.copied : t.plan.copy}</span>
          </Button>
        }
      >
        {t.plan.shopping}
      </SectionTitle>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {groups.map(([cat, items]) => (
          <div key={cat}>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-fg-subtle">{cat}</p>
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const on = checked.has(item.name);
                return (
                  <li key={item.name}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setChecked((s) => {
                            const n = new Set(s);
                            if (on) n.delete(item.name);
                            else n.add(item.name);
                            return n;
                          })
                        }
                        className="h-4 w-4 rounded accent-[rgb(var(--vh-brand-600))]"
                      />
                      <span className={cx("flex-1 text-body", on ? "text-fg-subtle line-through" : "text-fg")}>{item.name}</span>
                      <span className="text-caption tabular-nums text-fg-muted">{item.amount}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Workouts({ plan }: { plan: Plan }) {
  const { t } = useAppT();
  const [doneToday, setDoneToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    listWorkouts()
      .then((logs) => setDoneToday(new Set(logs.filter((l) => l.day === today()).map((l) => l.title))))
      .catch(() => undefined);
  }, []);

  async function mark(w: Workout) {
    setDoneToday((s) => new Set(s).add(w.title));
    try {
      await logWorkout(w.title);
    } catch {
      setDoneToday((s) => {
        const n = new Set(s);
        n.delete(w.title);
        return n;
      });
    }
  }

  const now = todayIndex();
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {plan.workouts.map((w) => {
        const isToday = w.day === now;
        const done = isToday && doneToday.has(w.title);
        return (
          <li key={w.day} className={cx("rounded-card border bg-surface p-4 shadow-card sm:p-5", isToday ? "border-brand-300" : "border-line")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption font-semibold text-fg-subtle">
                  {t.days.long[w.day]}
                  {isToday && <span className="ml-2 text-brand-700">· {t.common.today}</span>}
                </p>
                <p className="mt-0.5 text-body font-semibold">{w.title}</p>
              </div>
              <FocusBadge focus={w.focus} />
            </div>
            {w.focus === "rest" ? (
              <p className="mt-3 text-body text-fg-muted">{t.plan.rest}</p>
            ) : (
              <>
                <ul className="mt-3 space-y-1.5">
                  {w.exercises.map((e) => (
                    <li key={e.name} className="flex justify-between gap-3 text-body">
                      <span className="text-fg">{e.name}</span>
                      <span className="shrink-0 tabular-nums text-fg-muted">
                        {e.sets ? fmt(t.plan.sets, { sets: e.sets, reps: e.reps ?? "" }) : e.seconds ? duration(e.seconds, t.common) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="inline-flex items-center gap-1.5 text-caption text-fg-muted">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {fmt(t.plan.minutes, { n: w.minutes })}
                  </span>
                  {isToday &&
                    (done ? (
                      <Badge tone="brand">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {t.plan.done}
                      </Badge>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => mark(w)}>
                        {t.plan.markDone}
                      </Button>
                    ))}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function duration(seconds: number, c: { min: string; sec: string }): string {
  return seconds >= 60 ? `${Math.round(seconds / 60)} ${c.min}` : `${seconds} ${c.sec}`;
}

function FocusBadge({ focus }: { focus: Workout["focus"] }) {
  const { t } = useAppT();
  const tone = focus === "fat_burn" ? "calorie" : focus === "strength" ? "brand" : focus === "mobility" ? "info" : "neutral";
  return (
    <Badge tone={tone}>
      {focus === "fat_burn" && <Flame className="h-3 w-3" aria-hidden="true" />}
      {focus === "strength" && <Dumbbell className="h-3 w-3" aria-hidden="true" />}
      {t.focus[focus]}
    </Badge>
  );
}
