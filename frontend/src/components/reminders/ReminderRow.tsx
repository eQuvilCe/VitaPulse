"use client";

import { Bell, BellOff, Trash2 } from "lucide-react";

import { describeDays, formatTime, type Reminder } from "@/lib/reminders";

interface Props {
  reminder: Reminder;
  onToggle: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

export default function ReminderRow({ reminder, onToggle, onDelete }: Props) {
  const Icon = reminder.enabled ? Bell : BellOff;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <button
        type="button"
        onClick={() => onToggle(reminder)}
        aria-label={reminder.enabled ? "Turn reminder off" : "Turn reminder on"}
        className={reminder.enabled ? "text-emerald-300" : "text-zinc-500"}
      >
        <Icon size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-lg leading-none">{formatTime(reminder.at)}</p>
        <p className="mt-1 truncate text-sm text-zinc-400">
          <span className="capitalize">{reminder.kind}</span> · {describeDays(reminder.days)}
          {reminder.message ? ` · ${reminder.message}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(reminder)}
        aria-label="Delete reminder"
        className="text-zinc-500 transition hover:text-rose-400"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
