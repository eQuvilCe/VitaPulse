"use client";

import { Droplets, Flame, Footprints, ListChecks, Moon } from "lucide-react";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/StatCard";
import { fetchDashboard, type Dashboard } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

function formatSleep(minutes: number | null): string {
  if (minutes === null) return "–";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in first.");
      return;
    }
    const saved = localStorage.getItem("lang");
    if (saved === "ru" || saved === "uz" || saved === "en") setLang(saved);
    fetchDashboard(token)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <main className="p-8 text-slate-400">{error}</main>;
  if (!data) return <main className="p-8 text-slate-400">…</main>;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon={Moon} label={t(lang, "sleep")} value={formatSleep(data.sleep_minutes)} />
        <StatCard icon={Droplets} label={t(lang, "water")} value={`${data.water_ml} ml`} />
        <StatCard icon={Footprints} label={t(lang, "steps")} value={String(data.steps)} />
        <StatCard icon={Flame} label={t(lang, "calories")} value={`${data.calories} kcal`} />
        <StatCard
          icon={ListChecks}
          label={t(lang, "habits")}
          value={`${data.habits_done}/${data.habits_total}`}
        />
      </div>
      <section className="rounded-2xl border border-white/5 bg-card p-5">
        <h2 className="mb-3 font-medium">{t(lang, "coach")}</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {data.tips.map((tip) => (
            <li key={tip}>{t(lang, tip)}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
