"use client";

import { useState } from "react";

type Props = {
  onSave: (minutes: number, quality: number) => Promise<unknown>;
};

export default function SleepForm({ onSave }: Props) {
  const [hours, setHours] = useState("7.5");
  const [quality, setQuality] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0 || h > 24) {
      setError("Enter hours between 0 and 24");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(Math.round(h * 60), quality);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Log last night&apos;s sleep</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-mist">
          Hours
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode="decimal"
            className="mt-1 block w-24 rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
          />
        </label>
        <label className="text-xs text-mist">
          Quality
          <select
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
          >
            {[1, 2, 3, 4, 5].map((q) => (
              <option key={q} value={q}>
                {q} / 5
              </option>
            ))}
          </select>
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
