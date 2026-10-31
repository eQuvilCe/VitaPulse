"use client";

import { useState, type FormEvent } from "react";

import { WEEKDAYS, type ReminderInput, type ReminderKind } from "@/lib/reminders";

const KINDS: ReminderKind[] = ["water", "sleep", "steps", "meal", "weight", "mood", "custom"];

interface Props {
  onSubmit: (input: ReminderInput) => Promise<void> | void;
}

export default function ReminderForm({ onSubmit }: Props) {
  const [kind, setKind] = useState<ReminderKind>("water");
  const [at, setAt] = useState("09:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (days.length === 0) return;
    setBusy(true);
    try {
      await onSubmit({ kind, at: `${at}:00`, days, message: message.trim(), enabled: true });
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex gap-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as ReminderKind)}
          className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 capitalize"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={at}
          onChange={(e) => setAt(e.target.value)}
          required
          className="rounded-lg bg-zinc-900 px-3 py-2 font-mono"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((label, d) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleDay(d)}
            aria-pressed={days.includes(d)}
            className={`rounded-full px-3 py-1 text-sm ${
              days.includes(d) ? "bg-emerald-400/20 text-emerald-200" : "bg-zinc-900 text-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={200}
        placeholder="Optional note"
        className="w-full rounded-lg bg-zinc-900 px-3 py-2"
      />
      <button
        type="submit"
        disabled={busy || days.length === 0}
        className="w-full rounded-lg bg-emerald-400 py-2 font-medium text-zinc-950 disabled:opacity-50"
      >
        Add reminder
      </button>
    </form>
  );
}
