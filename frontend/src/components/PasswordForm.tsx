"use client";

import { useState } from "react";

type Props = {
  onSave: (current: string, next: string) => Promise<unknown>;
};

export default function PasswordForm({ onSave }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      setMessage({ ok: false, text: "New password needs at least 8 characters" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await onSave(current, next);
      setCurrent("");
      setNext("");
      setMessage({ ok: true, text: "Password changed" });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 block w-full rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Change password</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-mist">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={input}
          />
        </label>
        <label className="text-xs text-mist">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={input}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={busy || !current || !next}
          className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
        >
          Update
        </button>
        {message && (
          <p className={`text-xs ${message.ok ? "text-mint" : "text-coral"}`}>{message.text}</p>
        )}
      </div>
    </form>
  );
}
