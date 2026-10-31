"use client";

import { useCallback, useEffect, useState } from "react";

import type { Reminder, ReminderInput } from "@/lib/reminders";
import { remindersApi } from "@/lib/remindersApi";

import ReminderForm from "./ReminderForm";
import ReminderRow from "./ReminderRow";

export default function RemindersCard({ token }: { token: string }) {
  const [items, setItems] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await remindersApi.list(token));
      setError(null);
    } catch {
      setError("Could not load reminders");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (input: ReminderInput) => {
    await remindersApi.create(token, input);
    await load();
  };

  const toggle = async (r: Reminder) => {
    await remindersApi.update(token, r.id, { enabled: !r.enabled });
    await load();
  };

  const remove = async (r: Reminder) => {
    await remindersApi.remove(token, r.id);
    await load();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Reminders</h2>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <ul className="space-y-2">
        {items.map((r) => (
          <ReminderRow key={r.id} reminder={r} onToggle={toggle} onDelete={remove} />
        ))}
      </ul>
      {items.length === 0 && !error && (
        <p className="text-sm text-zinc-500">No reminders yet. Add one below.</p>
      )}
      <ReminderForm onSubmit={add} />
    </section>
  );
}
