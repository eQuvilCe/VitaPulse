"use client";

import { useState } from "react";

import type { User } from "@/lib/auth";

type Props = {
  user: User;
  onSave: (patch: { name: string; language: User["language"] }) => Promise<unknown>;
};

const LANGUAGES: { code: User["language"]; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uz", label: "Oʻzbekcha" },
];

export default function ProfileForm({ user, onSave }: Props) {
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState<User["language"]>(user.language);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await onSave({ name: name.trim(), language });
      setMessage({ ok: true, text: "Profile saved" });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-plum-2 p-5">
      <h2 className="text-sm text-mist">Profile</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-mist">
          Name
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
          />
        </label>
        <label className="text-xs text-mist">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as User["language"])}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-plum px-3 py-2 text-sm text-glow outline-none focus:border-mint"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={busy}
          className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
        >
          Save
        </button>
        {message && (
          <p className={`text-xs ${message.ok ? "text-mint" : "text-coral"}`}>{message.text}</p>
        )}
      </div>
    </form>
  );
}
