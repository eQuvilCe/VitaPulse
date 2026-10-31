"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Card, Input, buttonClasses } from "@/components/ui";
import { cx } from "@/lib/cx";
import { fill, useCopy } from "./copy";
import { LIMITS, bmiCategory, estimate, inRange, signupQuery, type Answers, type Goal, type Sex } from "./quiz/plan";
import Reveal from "./Reveal";

type Field = "age" | "height" | "weight";

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div>
      <p id={id} className="mb-1.5 text-caption font-medium">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-2 gap-2">
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
                "h-12 rounded-card border text-[15px] font-medium transition-colors",
                on ? "border-fg bg-fg text-canvas" : "border-line hover:border-fg",
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

// Mini questionnaire: BMI and a daily calorie target worked out in the
// browser, then the answers go to sign-up in the query string.
export default function Quiz() {
  const { c, locale } = useCopy();
  const q = c.quiz;
  const byId = useId();
  const [sex, setSex] = useState<Sex>("female");
  const [goal, setGoal] = useState<Goal>("lose");
  const [goalKg, setGoalKg] = useState(5);
  const [values, setValues] = useState<Record<Field, string>>({ age: "", height: "", weight: "" });

  const num = (f: Field) => Number(values[f].replace(",", "."));
  const filled = values.age !== "" && values.height !== "" && values.weight !== "";
  const valid = (["age", "height", "weight"] as const).every((f) => inRange(num(f), LIMITS[f]));
  const answers: Answers | null =
    filled && valid
      ? { sex, goal, goalKg, activity: "moderate", age: Math.round(num("age")), height: Math.round(num("height")), weight: num("weight") }
      : null;
  const est = useMemo(() => (answers ? estimate(answers) : null), [JSON.stringify(answers)]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = (v: number, d = 0) => v.toLocaleString(locale, { maximumFractionDigits: d, minimumFractionDigits: d });

  const field = (f: Field, label: string, suffix: string, placeholder: string) => (
    <Input
      label={label}
      suffix={suffix}
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={values[f]}
      onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 5) }))}
      className="min-w-0 [&_input]:pl-3 [&_input]:pr-10 [&_span]:right-3"
    />
  );

  const stepper = "flex h-12 w-12 items-center justify-center rounded-card border border-line transition-colors hover:border-fg";

  return (
    <section id="plan" className="border-t border-line px-4 py-20 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Reveal as="h2" className="font-display text-[clamp(48px,8vw,90px)] uppercase leading-[0.85]">
            {q.title}
          </Reveal>
          <Reveal as="p" delay={80} className="mt-6 max-w-sm text-lg leading-snug text-fg-muted">
            {q.lead}
          </Reveal>
        </div>

        <Reveal delay={120}>
          <Card className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Choice label={q.sex} value={sex} onChange={setSex} options={[{ value: "female", label: q.female }, { value: "male", label: q.male }]} />
              <Choice label={q.goal} value={goal} onChange={setGoal} options={[{ value: "lose", label: q.lose }, { value: "gain", label: q.gain }]} />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {field("age", q.age, c.units.yrs, "30")}
              {field("height", q.height, c.units.cm, "170")}
              {field("weight", q.weight, c.units.kg, "70")}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span id={byId} className="text-caption font-medium">
                {q.by}
              </span>
              <div role="group" aria-labelledby={byId} className="flex items-center gap-2">
                <button type="button" aria-label={q.less} onClick={() => setGoalKg((k) => Math.max(LIMITS.goalKg[0], k - 1))} className={stepper}>
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <output aria-live="polite" className="w-20 text-center text-xl font-semibold tabular-nums">
                  {goal === "lose" ? "−" : "+"}
                  {goalKg} {c.units.kg}
                </output>
                <button type="button" aria-label={q.more} onClick={() => setGoalKg((k) => Math.min(LIMITS.goalKg[1], k + 1))} className={stepper}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="border-t border-line pt-5" aria-live="polite">
              {est && answers ? (
                <>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-caption text-fg-muted">{q.bmi}</dt>
                      <dd className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{n(est.bmi, 1)}</dd>
                      <dd className="mt-1 text-caption">{q.categories[bmiCategory(est.bmi)]}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-fg-muted">{q.kcal}</dt>
                      <dd className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{n(est.kcal)}</dd>
                      <dd className="mt-1 text-caption">{c.units.kcal}</dd>
                    </div>
                  </dl>
                  {est.weeks > 0 && (
                    <p className="mt-4 text-caption text-fg-muted">
                      {fill(q.weeks, { weeks: est.weeks, weight: est.target.toLocaleString(locale, { maximumFractionDigits: 1 }), unit: c.units.kg })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-body text-fg-muted">{filled && !valid ? q.invalid : q.empty}</p>
              )}
            </div>

            <a href={answers && est ? `/signup?${signupQuery(answers, est)}` : "/signup"} className={buttonClasses({ size: "lg", className: "w-full" })}>
              {q.cta}
            </a>
            <p className="text-center text-[13px] text-fg-subtle">{q.note}</p>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
