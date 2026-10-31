"use client";

import { ArrowLeft, ArrowRight, Building2, Home, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Input } from "@/components/ui";
import { createPlan, fetchPlan, getToken, type Activity, type GoalKind, type PlanInput, type Restriction } from "@/lib/api-vita";
import { bmiCategory, bmiValue, estimate } from "@/lib/estimate";
import { cx } from "@/lib/cx";

import { ChoiceGroup, MultiChoice } from "./Choice";
import { clearDraft, draftFromQuery, loadDraft, RESTRICTIONS, saveDraft, withDefaults } from "./draft";
import { fmt, formatDate, formatNumber, useAppT } from "./i18n";

type Step = 0 | 1 | 2;
type Errors = Partial<Record<"height_cm" | "weight_kg" | "age" | "target_change_kg" | "target_date", string>>;

const LIMITS = {
  height_cm: [120, 230],
  weight_kg: [35, 300],
  age: [14, 100],
  target_change_kg: [0.5, 80],
} as const;

export default function Onboarding() {
  const { t, locale } = useAppT();
  const o = t.onboarding;
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState<PlanInput>(() => withDefaults({}));
  const [step, setStep] = useState<Step>(0);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Prefill: saved draft, then the existing plan, then whatever the query brings.
  useEffect(() => {
    const fromQuery = draftFromQuery(new URLSearchParams(params.toString()));
    const draft = { ...loadDraft(), ...fromQuery };
    setSignedIn(Boolean(getToken()));
    setForm(withDefaults(draft));
    if (getToken() && !Object.keys(draft).length) {
      fetchPlan(locale)
        .then((plan) => plan && setForm(plan.input))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof PlanInput>(key: K, value: PlanInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      saveDraft(next);
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const numField = (key: keyof typeof LIMITS) => ({
    value: form[key] ? String(form[key]) : "",
    inputMode: "decimal" as const,
    error: errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, Number(e.target.value.replace(",", ".")) || 0),
  });

  function validate(s: Step): boolean {
    const next: Errors = {};
    const check = (key: keyof typeof LIMITS) => {
      const v = form[key];
      const [min, max] = LIMITS[key];
      if (!v) next[key] = o.required;
      else if (v < min || v > max) next[key] = o.range;
    };
    if (s === 0) (["height_cm", "weight_kg", "age"] as const).forEach(check);
    if (s === 1 && form.goal !== "maintain") {
      check("target_change_kg");
      if (!form.target_date) next.target_date = o.required;
      else if (new Date(form.target_date) <= new Date()) next.target_date = o.range;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate(step)) return;
    const input: PlanInput = { ...form, target_change_kg: form.goal === "maintain" ? 0 : form.target_change_kg };
    if (!getToken()) {
      saveDraft(input);
      router.push("/signup");
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await createPlan(input, locale);
      clearDraft();
      router.push("/plan");
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  function goNext() {
    if (!validate(step)) return;
    if (step < 2) setStep((s) => (s + 1) as Step);
    else submit();
  }

  const preview = useMemo(() => {
    if (!form.height_cm || !form.weight_kg || !form.age) return null;
    if (form.height_cm < 120 || form.weight_kg < 35) return null;
    const bmi = bmiValue(form.weight_kg, form.height_cm);
    const plan = estimate({ ...form, goal_kg: form.target_change_kg });
    return { bmi, category: bmiCategory(bmi), plan };
  }, [form]);

  const steps = [o.stepBody, o.stepGoal, o.stepLife];
  const minDate = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

  return (
    <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-6">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-caption font-semibold text-brand-800 ring-1 ring-inset ring-brand-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {o.title}
          </p>
          <h1 className="text-title font-semibold">{steps[step]}</h1>
          <p className="mt-1.5 text-body text-fg-muted">{o.lead}</p>
        </div>

        <ol className="mb-6 flex gap-2" aria-label={o.title}>
          {steps.map((label, i) => (
            <li key={label} className="flex-1">
              <span className={cx("block h-1.5 rounded-full transition-colors duration-500", i <= step ? "bg-brand-500" : "bg-line")} />
              <span className={cx("mt-1.5 block text-[11px] font-semibold", i === step ? "text-fg" : "text-fg-subtle")} aria-current={i === step ? "step" : undefined}>
                {label}
              </span>
            </li>
          ))}
        </ol>

        <Card className="rounded-panel p-5 sm:p-7">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goNext();
            }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <ChoiceGroup
                  label={o.sex}
                  value={form.sex}
                  onChange={(v) => set("sex", v)}
                  options={[
                    { value: "female", label: o.female },
                    { value: "male", label: o.male },
                  ]}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label={o.height} suffix={t.common.cm} autoFocus {...numField("height_cm")} />
                  <Input label={o.weight} suffix={t.common.kg} {...numField("weight_kg")} />
                  <Input label={o.age} suffix={t.common.years} {...numField("age")} inputMode="numeric" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <ChoiceGroup<GoalKind>
                  label={o.goal}
                  value={form.goal}
                  onChange={(v) => set("goal", v)}
                  columns={3}
                  options={[
                    { value: "lose", label: o.lose },
                    { value: "gain", label: o.gain },
                    { value: "maintain", label: o.maintain },
                  ]}
                />
                {form.goal !== "maintain" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label={o.change} suffix={t.common.kg} {...numField("target_change_kg")} />
                    <Input
                      label={o.by}
                      type="date"
                      min={minDate}
                      value={form.target_date}
                      error={errors.target_date}
                      onChange={(e) => set("target_date", e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <ChoiceGroup<Activity>
                  label={o.activity}
                  value={form.activity}
                  onChange={(v) => set("activity", v)}
                  options={(["sedentary", "light", "moderate", "active"] as const).map((a) => ({
                    value: a,
                    label: o[a],
                    hint: o[`${a}Hint` as const],
                  }))}
                />
                <ChoiceGroup
                  label={o.place}
                  value={form.place}
                  onChange={(v) => set("place", v)}
                  options={[
                    { value: "home", label: o.home, icon: <Home className="h-5 w-5" aria-hidden="true" /> },
                    { value: "gym", label: o.gym, icon: <Building2 className="h-5 w-5" aria-hidden="true" /> },
                  ]}
                />
                <MultiChoice<Restriction>
                  label={o.restrictions}
                  hint={o.restrictionsHint}
                  value={form.restrictions}
                  onChange={(v) => set("restrictions", v)}
                  options={RESTRICTIONS.map((r) => ({ value: r, label: o[r] }))}
                />
              </>
            )}

            {failed && (
              <p role="alert" className="rounded-field bg-danger-soft px-3 py-2 text-caption text-danger">
                {t.common.error}
              </p>
            )}
            {step === 2 && !signedIn && <p className="text-caption text-fg-muted">{o.signupFirst}</p>}

            <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as Step)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {t.common.back}
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? o.building : step < 2 ? o.next : o.build}
                {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {preview && (
        <aside className="lg:pt-[132px]" aria-live="polite">
          <Card tone="brand" className="space-y-4">
            <div>
              <p className="text-caption font-semibold text-brand-800">{t.bmi.now}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-title font-semibold tabular-nums">{formatNumber(preview.bmi, locale, 1)}</span>
                <span className="text-caption text-fg-muted">
                  {t.nav.bmi} · {t.bmi.categories[preview.category]}
                </span>
              </p>
            </div>
            {preview.plan && (
              <div className="border-t border-brand-100 pt-4">
                <p className="text-caption font-semibold text-brand-800">{t.plan.daily}</p>
                <p className="mt-1 text-title font-semibold tabular-nums">
                  {formatNumber(preview.plan.calories, locale)} <span className="text-body font-normal text-fg-muted">{t.common.kcal}</span>
                </p>
                {form.goal !== "maintain" && preview.plan.forecast_date && (
                  <p className="mt-2 text-caption text-fg-muted">
                    {t.plan.forecast}: <span className="font-semibold text-fg">{formatDate(preview.plan.forecast_date, locale)}</span>
                  </p>
                )}
                <p className="mt-1 text-caption text-fg-muted">
                  {fmt(t.plan.tdee, { tdee: formatNumber(preview.plan.tdee, locale) })}
                </p>
              </div>
            )}
          </Card>
        </aside>
      )}
    </div>
  );
}
