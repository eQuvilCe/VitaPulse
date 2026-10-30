"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Logo from "@/components/landing/Logo";
import StatCard from "@/components/StatCard";
import { fetchMe, logout, type User } from "@/lib/auth";
import { fetchDashboard, type Dashboard } from "@/lib/dashboard";
import { tipText } from "@/lib/tips";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (user) fetchDashboard()
        .then(setData)
        .catch(() => setFailed(true));
  }, [user]);

  if (!user) return <main className="min-h-screen bg-plum p-8 text-mist">Loading...</main>;

  return (
    <main className="min-h-screen bg-plum text-glow">
      <div className="mx-auto max-w-4xl p-6">
        <header className="flex items-center justify-between">
          <Logo />
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-mist transition-colors duration-300 hover:bg-white/5 hover:text-glow"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>
        <h1 className="mt-12 font-serif text-4xl tracking-tight">Hi, {user.name || user.email}</h1>
        {failed && <p className="mt-8 text-sm text-coral">Could not load today's stats.</p>}
        {data && (
          <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Sleep"
              value={data.sleep_minutes === null ? "-" : `${(data.sleep_minutes / 60).toFixed(1)} h`}
              goal={`${data.goals.sleep_minutes / 60} h`}
              progress={(data.sleep_minutes ?? 0) / data.goals.sleep_minutes}
            />
            <StatCard
              label="Water"
              value={`${data.water_ml} ml`}
              goal={`${data.goals.water_ml} ml`}
              progress={data.water_ml / data.goals.water_ml}
            />
            <StatCard
              label="Steps"
              value={data.steps.toLocaleString("en")}
              goal={data.goals.steps.toLocaleString("en")}
              progress={data.steps / data.goals.steps}
            />
            <StatCard
              label="Calories"
              value={`${data.calories} kcal`}
              goal={`${data.goals.calories} kcal`}
              progress={data.calories / data.goals.calories}
            />
          </section>
        )}
        {data && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-plum-2 p-5">
            <h2 className="text-sm text-mist">Coach</h2>
            <ul className="mt-3 space-y-2">
              {data.tips.map((code) => (
                <li key={code} className="text-glow">
                  {tipText(code)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
