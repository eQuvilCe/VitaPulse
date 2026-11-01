"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  unit: string;
  presets: number[];
  onAdd: (amount: number) => Promise<unknown>;
};

export default function QuickAdd({ title, unit, presets, onAdd }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(amount: number) {
    setBusy(true);
    setError(null);
    try {
      await onAdd(amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((amount) => (
          <button
            key={amount}
            disabled={busy}
            onClick={() => add(amount)}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-sm transition-colors duration-300 hover:bg-white/5 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> {amount.toLocaleString("en")} {unit}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-coral">{error}</p>}
    </div>
  );
}
