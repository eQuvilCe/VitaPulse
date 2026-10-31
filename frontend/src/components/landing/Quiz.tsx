"use client";

import { ArrowRight } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { cx } from "@/lib/cx";
import { fill, useCopy } from "./copy";
import { BMI_SCALE, bmiCategory, estimate, signupQuery, type Answers, type Goal, type Sex } from "./quiz/plan";
import Reveal from "./Reveal";
import { useCountUp } from "./useCountUp";

// Slider ranges. Defaults sit mid-range so the result card is never empty.
const RANGE = {
  age: { min: 16, max: 80, step: 1 },
  height: { min: 140, max: 210, step: 1 },
  weight: { min: 40, max: 160, step: 1 },
  goalKg: { min: 1, max: 30, step: 1 },
} as const;

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="flex-1">
      <p id={id} className="mb-2 text-caption text-fg-muted">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-2 gap-1 rounded-card border border-line p-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cx("h-10 rounded-[16px] text-[15px] font-medium transition-colors duration-300", on ? "bg-fg text-canvas" : "hover:bg-subtle")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// A labelled range input with its value set huge in the display face.
function Slider({ label, unit, value, onChange, range, prefix = "" }: { label: string; unit: string; value: number; onChange: (v: number) => void; range: { min: number; max: number; step: number }; prefix?: string }) {
  const id = useId();
  const pct = ((value - range.min) / (range.max - range.min)) * 100;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="pb-1 text-caption text-fg-muted">
          {label}
        </label>
        <output htmlFor={id} className="font-display text-[44px] uppercase leading-[0.85] tabular-nums">
          {prefix}
          {value}
          <span className="ml-1.5 font-sans text-caption normal-case text-fg-muted">{unit}</span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vl-range mt-3"
        style={{ "--p": `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}

const scalePos = (bmi: number) =>
  `${((Math.min(Math.max(bmi, BMI_SCALE.min), BMI_SCALE.max) - BMI_SCALE.min) / (BMI_SCALE.max - BMI_SCALE.min)) * 100}%`;

// BMI scale on the violet card: a faint track, the healthy band in cream and
// two markers, "now" (solid) and "goal" (ring), that glide as values change.
function BmiScale({ now, goal, labels }: { now: number; goal: number; labels: { now: string; goal: string } }) {
  const [a, b] = BMI_SCALE.bands;
  return (
    <div className="relative mt-8 h-14" aria-hidden="true">
      <div className="absolute inset-x-0 top-[26px] h-1.5 rounded-card bg-accent-on/25" />
      <div className="absolute top-[26px] h-1.5 rounded-card bg-accent-on/70" style={{ left: scalePos(a), width: `calc(${scalePos(b)} - ${scalePos(a)})` }} />
      {/* "now" is labelled above the track and "goal" below, so close values never collide. */}
      {[
        { v: goal, label: labels.goal, cls: "border-accent-on bg-accent", above: false },
        { v: now, label: labels.now, cls: "border-accent bg-accent-on", above: true },
      ].map((m) => (
        <span key={m.label} className="vl-marker absolute top-[21px] -translate-x-1/2" style={{ left: scalePos(m.v) }}>
          <span className={cx("block h-4 w-4 rounded-card border-[3px]", m.cls)} />
          <span className={cx("absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] opacity-80", m.above ? "bottom-5" : "top-5")}>{m.label}</span>
        </span>
      ))}
    </div>
  );
}

// Calorie ring: how the daily target compares with what keeps weight steady.
function KcalRing({ kcal, maintenance, label, locale }: { kcal: number; maintenance: number; label: string; locale: string }) {
  const shown = useCountUp(kcal);
  const frac = Math.min(kcal / Math.max(maintenance, 1), 1);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[200px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          style={{ strokeDashoffset: 1 - frac, transition: "stroke-dashoffset 0.9s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[52px] leading-[0.85] tabular-nums">{Math.round(shown).toLocaleString(locale)}</span>
        <span className="mt-1.5 text-caption opacity-80">{label}</span>
      </div>
    </div>
  );
}

// "Your numbers": sliders on the left, a violet result card on the right with
// BMI, a calorie ring and a dated forecast. Everything recalculates live and
// the button hands the answers to sign-up.
export default function Quiz() {
  const { c, locale } = useCopy();
  const q = c.quiz;
  const [sex, setSex] = useState<Sex>("female");
  const [goal, setGoal] = useState<Goal>("lose");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(168);
  const [weight, setWeight] = useState(72);
  const [goalKg, setGoalKg] = useState(5);

  const answers: Answers = { sex, goal, goalKg, activity: "moderate", age, height, weight };
  const est = useMemo(() => estimate(answers), [sex, goal, goalKg, age, height, weight]); // eslint-disable-line react-hooks/exhaustive-deps
  const bmi = useCountUp(est.bmi);
  const category = bmiCategory(est.bmi);
  const change = est.target - weight;
  const date = est.date.toLocaleDateString(locale, { day: "numeric", month: "long" });
  const kg = (v: number) => v.toLocaleString(locale, { maximumFractionDigits: 1 });

  return (
    <section id="plan" className="px-4 py-20 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Reveal as="h2" className="font-display text-[clamp(56px,9vw,120px)] uppercase leading-[0.85]">
            {q.title}
          </Reveal>
          <Reveal as="p" delay={80} className="max-w-xs text-lg leading-snug text-fg-muted md:pb-2">
            {q.lead}
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Reveal delay={120} className="rounded-card border border-line-strong p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Choice label={q.sex} value={sex} onChange={setSex} options={[{ value: "female", label: q.female }, { value: "male", label: q.male }]} />
              <Choice label={q.goal} value={goal} onChange={setGoal} options={[{ value: "lose", label: q.lose }, { value: "gain", label: q.gain }]} />
            </div>
            <div className="mt-8 space-y-7">
              <Slider label={q.height} unit={c.units.cm} value={height} onChange={setHeight} range={RANGE.height} />
              <Slider label={q.weight} unit={c.units.kg} value={weight} onChange={setWeight} range={RANGE.weight} />
              <Slider label={q.age} unit={c.units.yrs} value={age} onChange={setAge} range={RANGE.age} />
              <Slider label={q.by} unit={c.units.kg} value={goalKg} onChange={setGoalKg} range={RANGE.goalKg} prefix={goal === "lose" ? "−" : "+"} />
            </div>
          </Reveal>

          <Reveal delay={200} className="flex flex-col rounded-card bg-accent p-6 text-accent-on sm:p-8">
            <div aria-live="polite" className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="text-caption opacity-80">{q.bmi}</p>
                <p className="mt-2 font-display text-[96px] leading-[0.85] tabular-nums sm:text-[120px]">
                  {bmi.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </p>
                <p className="mt-3 inline-flex rounded-card border border-accent-on/40 px-3 py-0.5 text-caption">{q.categories[category]}</p>
              </div>
              <KcalRing kcal={est.kcal} maintenance={est.maintenance} label={q.kcal} locale={locale} />
            </div>

            <BmiScale now={est.bmi} goal={est.targetBmi} labels={{ now: q.now, goal: q.target }} />
            <p className="mt-1 text-caption opacity-80">{fill(q.healthy, { min: est.healthy.min, max: est.healthy.max })}</p>

            <div className="mt-8 border-t border-accent-on/25 pt-6">
              <p className="text-caption opacity-80">{q.forecast}</p>
              <p className="mt-2 font-display text-[clamp(40px,6vw,64px)] uppercase leading-[0.85]">
                {fill(q.by_date, { change: `${change > 0 ? "+" : "−"}${kg(Math.abs(change))}`, date })}
              </p>
              <p className="mt-2 text-caption opacity-80">{est.lowTarget ? q.lowTarget : q.pace[goal]}</p>
            </div>

            <a
              href={`/signup?${signupQuery(answers, est)}`}
              className="group mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-card bg-accent-on px-7 text-base font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
            >
              {q.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <p className="mt-3 text-center text-[12px] opacity-70">{q.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
