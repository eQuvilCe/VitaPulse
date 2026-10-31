"use client";

import { Check, Flame, Plus } from "lucide-react";
import { useState } from "react";

import type { Habit } from "@/lib/habits";

type Props = {
  habits: Habit[];
  onToggle: (habit: Habit) => Promise<unknown>;
  onCreate: (name: string) => Promise<unknown>;
};

export default function HabitList({ habits, onToggle, onCreate }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    run(async () => {
      await onCreate(value);
      setName("");
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Habits</h2>
      <ul className="mt-3 space-y-2">
        {habits.map((h) => (
          <li key={h.id}>
            <button
              disabled={busy}
              onClick={() => run(() => onToggle(h))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-300 hover:bg-white/5 disabled:opacity-60"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  h.done_today ? "border-mint bg-mint text-plum" : "border-white/20"
                }`}
              >
                {h.done_today && <Check className="h-4 w-4" />}
              </span>
              <span className={h.done_today ? "text-mist line-through" : "text-glow"}>{h.name}</span>
              {h.current_streak > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs text-coral">
                  <Flame className="h-3.5 w-3.5" /> {h.current_streak}
                </span>
              )}
            </button>
          </li>
        ))}
        {habits.length === 0 && <li className="text-sm text-mist">No habits yet. Add your first one.</li>}
      </ul>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="New habit"
          className="block w-full rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
        />
        <button
          type="submit"
          disabled={busy}
          aria-label="Add habit"
          className="rounded-lg bg-mint px-3 text-plum disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
