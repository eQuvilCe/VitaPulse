"use client";

import { useState } from "react";

import type { MealInput } from "@/lib/meals";

type Props = {
  onSave: (meal: MealInput) => Promise<unknown>;
};

const field =
  "mt-1 block w-full rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint";

export default function MealForm({ onSave }: Props) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const kcal = Number(calories);
    if (!name.trim() || !Number.isFinite(kcal) || kcal < 0) {
      setError("Add a name and a calorie count");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), calories: Math.round(kcal), protein_g: Number(protein) || 0 });
      setName("");
      setCalories("");
      setProtein("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Log a meal</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="col-span-2 text-xs text-mist">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="text-xs text-mist">
          Calories
          <input
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            inputMode="numeric"
            className={field}
          />
        </label>
        <label className="text-xs text-mist">
          Protein, g
          <input
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            inputMode="decimal"
            className={field}
          />
        </label>
      </div>
      <button
        disabled={busy}
        className="mt-4 rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
      >
        Add meal
      </button>
      {error && <p className="mt-3 text-xs text-coral">{error}</p>}
    </form>
  );
}
