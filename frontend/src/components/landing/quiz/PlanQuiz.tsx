"use client";

import { ArrowRight, CalendarCheck, Info } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Badge, Input, buttonClasses } from "@/components/ui";
import { cx } from "@/lib/cx";
import { fill, useCopy } from "../copy";
import Reveal from "../Reveal";
import {
  BMI_SCALE,
  LIMITS,
  bmiCategory,
  estimate,
  inRange,
  signupQuery,
  type Activity,
  type Answers,
  type BmiCategory,
  type Estimate,
  type Goal,
  type Sex,
} from "./plan";

type Field = "age" | "height" | "weight";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div>
      <p id={id} className="mb-1.5 text-caption font-semibold text-fg">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1 rounded-field bg-subtle p-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cx(
                "min-h-9 flex-1 rounded-[10px] px-2 py-1.5 text-caption font-semibold leading-tight transition-[background-color,color,box-shadow] duration-300",
                on ? "bg-surface text-brand-800 shadow-card" : "text-fg-muted hover:text-fg",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CATEGORY_TONE: Record<BmiCategory, "info" | "brand" | "warn" | "calorie"> = {
  under: "info",
  normal: "brand",
  over: "warn",
  obese: "calorie",
};

const pos = (bmi: number) =>
  `${((Math.min(Math.max(bmi, BMI_SCALE.min), BMI_SCALE.max) - BMI_SCALE.min) / (BMI_SCALE.max - BMI_SCALE.min)) * 100}%`;

function BmiScale({ now, goal, labels }: { now: number; goal: number; labels: { now: string; goal: string } }) {
  const [a, b, c] = BMI_SCALE.bands;
  const span = BMI_SCALE.max - BMI_SCALE.min;
  const w = (from: number, to: number) => `${((to - from) / span) * 100}%`;
  return (
    <div className="relative pb-6 pt-7" aria-hidden="true">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <span className="bg-info/60" style={{ width: w(BMI_SCALE.min, a) }} />
        <span className="bg-brand-500" style={{ width: w(a, b) }} />
        <span className="bg-warn/70" style={{ width: w(b, c) }} />
        <span className="flex-1 bg-kcal-500/70" />
      </div>
      {[
        { v: goal, label: labels.goal, cls: "border-brand-700 bg-surface", top: false },
        { v: now, label: labels.now, cls: "border-white bg-fg", top: true },
      ].map((m) => (
        <span key={m.label} className="vl-marker absolute top-[22px] -translate-x-1/2" style={{ left: pos(m.v) }}>
          <span className={cx("block h-4 w-4 rounded-full border-[3px] shadow-card", m.cls)} />
          <span
            className={cx(
              "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold",
              m.top ? "-top-5 text-fg" : "top-5 text-brand-800",
            )}
          >
            {m.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function Results({ answers, est }: { answers: Answers; est: Estimate }) {
  const { c, locale } = useCopy();
  const q = c.quiz;
  const n = (v: number, digits = 0) => v.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const category = bmiCategory(est.bmi);
  const sameYear = est.date.getFullYear() === new Date().getFullYear();
  const date = est.date.toLocaleDateString(locale, { day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) });

  return (
    <div className="space-y-5" aria-live="polite">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold text-fg-muted">{q.bmi}</p>
            <p className="font-serif text-[44px] leading-none text-fg">{n(est.bmi, 1)}</p>
          </div>
          <Badge tone={CATEGORY_TONE[category]} className="mt-1">
            {q.categories[category]}
          </Badge>
        </div>
        <BmiScale now={est.bmi} goal={est.targetBmi} labels={{ now: q.bmiNow, goal: q.bmiGoal }} />
        <p className="text-caption text-fg-muted">
          {fill(q.healthyRange, { height: answers.height, min: est.healthy.min, max: est.healthy.max })}
        </p>
      </div>

      <div className="rounded-card bg-surface p-4 shadow-card">
        <p className="text-caption font-semibold text-fg-muted">{q.calories}</p>
        <p className="mt-0.5 font-serif text-[36px] leading-tight text-fg">
          {n(est.kcal)} <span className="font-sans text-body text-fg-muted">{c.units.kcal}</span>
        </p>
        <p className="text-caption text-fg-subtle">{fill(q.maintenance, { kcal: n(est.maintenance) })}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { k: q.protein, v: est.macros.protein, cls: "bg-brand-50 text-brand-800" },
            { k: q.fat, v: est.macros.fat, cls: "bg-warn-soft text-warn-strong" },
            { k: q.carbs, v: est.macros.carbs, cls: "bg-info-soft text-info" },
          ].map((m) => (
            <div key={m.k} className={cx("rounded-field px-1 py-2", m.cls)}>
              <dt className="text-[11px] font-semibold">{m.k}</dt>
              <dd className="text-body font-bold">
                {n(m.v)} <span className="text-[11px] font-semibold">{c.units.g}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {est.weeks > 0 && (
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand-700 shadow-card">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="text-body">
            <p className="font-semibold text-fg">
              {fill(q.eta, { weight: est.target.toLocaleString(locale, { maximumFractionDigits: 1 }), weeks: est.weeks })}, {fill(q.etaDate, { date })}
            </p>
            <p className="text-caption text-fg-muted">{q.pace[answers.goal]}</p>
          </div>
        </div>
      )}

      {est.lowTarget && (
        <p className="flex gap-2 rounded-field bg-warn-soft p-3 text-caption text-warn-strong">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {q.lowTarget}
        </p>
      )}
    </div>
  );
}

export default function PlanQuiz() {
  const { c } = useCopy();
  const q = c.quiz;
  const [sex, setSex] = useState<Sex>("female");
  const [goal, setGoal] = useState<Goal>("lose");
  const [goalKg, setGoalKg] = useState(5);
  const [activity, setActivity] = useState<Activity>("moderate");
  const [values, setValues] = useState<Record<Field, string>>({ age: "", height: "", weight: "" });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ age: false, height: false, weight: false });

  const num = (f: Field) => Number(values[f].replace(",", "."));
  const valid = (f: Field) => values[f] !== "" && inRange(num(f), LIMITS[f]);
  const error = (f: Field) => (touched[f] && values[f] !== "" && !valid(f) ? q.errors[f] : undefined);
  const ready = valid("age") && valid("height") && valid("weight");

  const answers: Answers | null = ready
    ? { sex, goal, goalKg, activity, age: Math.round(num("age")), height: Math.round(num("height")), weight: num("weight") }
    : null;
  const est = useMemo(() => (answers ? estimate(answers) : null), [JSON.stringify(answers)]); // eslint-disable-line react-hooks/exhaustive-deps

  const field = (f: Field, label: string, suffix: string, placeholder: string) => (
    <Input
      label={label}
      suffix={suffix}
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={values[f]}
      error={error(f)}
      onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 5) }))}
      onBlur={() => setTouched((t) => ({ ...t, [f]: true }))}
    />
  );

  return (
    <section id="plan" className="relative px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Reveal as="p" className="vl-eyebrow">
            {q.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={100} className="vl-display mt-3 text-[clamp(32px,4.6vw,52px)] leading-[1.06] text-fg [text-wrap:balance]">
            {q.title}
          </Reveal>
          <Reveal as="p" delay={200} className="mt-4 text-lead text-fg-muted [text-wrap:pretty]">
            {q.lead}
          </Reveal>
        </div>

        <Reveal delay={250} className="mt-10 grid overflow-hidden rounded-panel border border-line bg-surface shadow-raised lg:grid-cols-[1.25fr_1fr]">
          <form className="space-y-5 p-5 sm:p-8" onSubmit={(e) => e.preventDefault()} noValidate>
            <Segmented
              label={q.sex}
              value={sex}
              onChange={setSex}
              options={[
                { value: "female", label: q.female },
                { value: "male", label: q.male },
              ]}
            />
            <div className="grid grid-cols-3 gap-3">
              {field("age", q.age, q.ageUnit, "30")}
              {field("height", q.height, c.units.cm, "170")}
              {field("weight", q.weight, c.units.kg, "70")}
            </div>
            <Segmented
              label={q.goal}
              value={goal}
              onChange={setGoal}
              options={[
                { value: "lose", label: q.lose },
                { value: "gain", label: q.gain },
              ]}
            />
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="goal-kg" className="text-caption font-semibold text-fg">
                  {q.amount}
                </label>
                <span className="font-serif text-xl text-brand-800">
                  {goal === "lose" ? "−" : "+"}
                  {goalKg} {c.units.kg}
                </span>
              </div>
              <input
                id="goal-kg"
                type="range"
                min={LIMITS.goalKg[0]}
                max={LIMITS.goalKg[1]}
                value={goalKg}
                onChange={(e) => setGoalKg(Number(e.target.value))}
                className="vl-range h-6 w-full cursor-pointer"
              />
            </div>
            <Segmented
              label={q.activity}
              value={activity}
              onChange={setActivity}
              options={[
                { value: "low", label: q.activityLow },
                { value: "moderate", label: q.activityModerate },
                { value: "high", label: q.activityHigh },
              ]}
            />
          </form>

          <div className="flex flex-col bg-brand-50 p-5 sm:p-8">
            <h3 className="text-heading text-fg">{q.results}</h3>
            <div className="mt-4 flex-1">
              {answers && est ? (
                <Results answers={answers} est={est} />
              ) : (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-card border-2 border-dashed border-brand-100 p-6 text-center">
                  <svg viewBox="0 0 120 40" className="h-10 w-28 text-brand-300" aria-hidden="true">
                    <path d="M0 26h34l6-10 8 20 10-34 8 24h54" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-3 max-w-[260px] text-body text-fg-muted">{q.empty}</p>
                </div>
              )}
            </div>
            {answers && est ? (
              <a href={`/signup?${signupQuery(answers, est)}`} className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}>
                {q.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <button type="button" disabled className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}>
                {q.cta}
              </button>
            )}
            <p className="mt-3 text-center text-[11px] leading-4 text-fg-subtle">{q.note}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
