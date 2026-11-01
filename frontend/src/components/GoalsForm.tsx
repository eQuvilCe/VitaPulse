"use client";

import { useState } from "react";

import type { Goals } from "@/lib/dashboard";

type Props = {
  goals: Goals;
  onSave: (goals: Goals) => Promise<unknown>;
};

export default function GoalsForm({ goals, onSave }: Props) {
  const [hours, setHours] = useState(String(goals.sleep_minutes / 60));
  const [water, setWater] = useState(String(goals.water_ml));
  const [steps, setSteps] = useState(String(goals.steps));
  const [calories, setCalories] = useState(String(goals.calories));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const values = [Number(hours), Number(water), Number(steps), Number(calories)];
    if (values.some((v) => !Number.isFinite(v) || v <= 0)) {
      setMessage({ ok: false, text: "All goals must be positive numbers" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await onSave({
        sleep_minutes: Math.round(values[0] * 60),
        water_ml: Math.round(values[1]),
        steps: Math.round(values[2]),
        calories: Math.round(values[3]),
      });
      setMessage({ ok: true, text: "Goals saved" });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const fields = [
    { label: "Sleep (hours)", value: hours, set: setHours },
    { label: "Water (ml)", value: water, set: setWater },
    { label: "Steps", value: steps, set: setSteps },
    { label: "Calories (kcal)", value: calories, set: setCalories },
  ];

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Daily goals</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {fields.map((f) => (
          <label key={f.label} className="text-xs text-mist">
            {f.label}
            <input
              value={f.value}
              inputMode="decimal"
              onChange={(e) => f.set(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={busy}
          className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
        >
          Save goals
        </button>
        {message && (
          <p className={`text-xs ${message.ok ? "text-mint" : "text-coral"}`}>{message.text}</p>
        )}
      </div>
    </form>
  );
}
