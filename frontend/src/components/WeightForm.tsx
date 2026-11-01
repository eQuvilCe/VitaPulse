"use client";

import { useState } from "react";

type Props = {
  onSave: (kg: number) => Promise<unknown>;
};

export default function WeightForm({ onSave }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const kg = Number(value.replace(",", "."));
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
      setError("Enter a weight between 20 and 400 kg");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(kg);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Log today&apos;s weight</h2>
      <div className="mt-3 flex items-end gap-3">
        <label className="text-xs text-mist">
          Weight (kg)
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="72.4"
            className="mt-1 block w-28 rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-coral">{error}</p>}
    </form>
  );
}
