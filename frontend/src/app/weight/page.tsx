"use client";

import { useCallback, useEffect, useState } from "react";

import AppHeader from "@/components/AppHeader";
import StatCard from "@/components/StatCard";
import WeightChart from "@/components/WeightChart";
import WeightForm from "@/components/WeightForm";
import { useRequireUser } from "@/hooks/useRequireUser";
import { setMetric } from "@/lib/metrics";
import { fetchWeightTrend, type WeightTrend } from "@/lib/weight";

export default function WeightPage() {
  const user = useRequireUser();
  const [trend, setTrend] = useState<WeightTrend | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(() => {
    fetchWeightTrend()
      .then((t) => {
        setTrend(t);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  if (!user) return <main className="min-h-screen bg-plum p-8 text-mist">Loading...</main>;

  const change = trend?.change_kg;

  return (
    <main className="min-h-screen bg-plum text-glow">
      <div className="mx-auto max-w-4xl p-6">
        <AppHeader />
        <h1 className="mt-12 font-serif text-4xl tracking-tight">Weight</h1>
        {failed && <p className="mt-6 text-sm text-coral">Could not load your weight history.</p>}
        {trend && (
          <section className="mt-8 grid grid-cols-2 gap-4">
            <StatCard
              label="Latest"
              value={trend.latest_kg === null ? "-" : `${trend.latest_kg} kg`}
            />
            <StatCard
              label="Change, 30 days"
              value={change == null ? "-" : `${change > 0 ? "+" : ""}${change} kg`}
            />
          </section>
        )}
        <section className="mt-6">
          <WeightForm onSave={(kg) => setMetric("weight_kg", kg).then(reload)} />
        </section>
        {trend && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-plum-2 p-5">
            <h2 className="text-sm text-mist">Last 30 days</h2>
            {trend.points.length > 0 ? (
              <div className="mt-4">
                <WeightChart points={trend.points} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-mist">No weigh-ins yet. Log one above to start.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
