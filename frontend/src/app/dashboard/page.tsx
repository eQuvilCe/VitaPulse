"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Badges from "@/components/Badges";
import HabitList from "@/components/HabitList";
import Logo from "@/components/landing/Logo";
import MealForm from "@/components/MealForm";
import QuickAdd from "@/components/QuickAdd";
import ScoreRing from "@/components/ScoreRing";
import SleepForm from "@/components/SleepForm";
import StatCard from "@/components/StatCard";
import WeekChart from "@/components/WeekChart";
import { fetchAchievements, type Achievements } from "@/lib/achievements";
import { fetchMe, logout, type User } from "@/lib/auth";
import { fetchDashboard, type Dashboard } from "@/lib/dashboard";
import { createHabit, fetchHabits, setDone, type Habit } from "@/lib/habits";
import { addMeal } from "@/lib/meals";
import { addMetric } from "@/lib/metrics";
import { logSleep } from "@/lib/sleep";
import { fetchWeek, type Week } from "@/lib/stats";
import { tipText } from "@/lib/tips";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [week, setWeek] = useState<Week | null>(null);
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [badges, setBadges] = useState<Achievements | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  const reload = useCallback(() => {
    fetchDashboard()
      .then((d) => {
        setData(d);
        setFailed(false);
      })
      .catch(() => setFailed(true));
    fetchWeek()
      .then(setWeek)
      .catch(() => undefined);
    fetchAchievements()
      .then(setBadges)
      .catch(() => undefined);
    fetchHabits()
      .then(setHabits)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

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
        {failed && <p className="mt-8 text-sm text-coral">Could not load the stats for today.</p>}
        {data?.score && (
          <section className="mt-8 flex items-center gap-6 rounded-2xl border border-white/10 bg-plum-2 p-5">
            <ScoreRing value={data.score.total} />
            <div>
              <h2 className="font-serif text-2xl tracking-tight">Today&apos;s score</h2>
              <p className="mt-1 text-sm text-mist">
                Sleep {data.score.sleep}/30 · Water {data.score.water}/20 · Steps{" "}
                {data.score.steps}/25 · Habits {data.score.habits}/25
              </p>
            </div>
          </section>
        )}
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
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickAdd
              title="Log water"
              unit="ml"
              presets={[200, 300, 500]}
              onAdd={(n) => addMetric("water_ml", n).then(reload)}
            />
            <MealForm onSave={(m) => addMeal(m).then(reload)} />
            <SleepForm onSave={(m, q) => logSleep(m, q).then(reload)} />
            <QuickAdd
              title="Log steps"
              unit="steps"
              presets={[1000, 2500, 5000]}
              onAdd={(n) => addMetric("steps", n).then(reload)}
            />
          </section>
        )}
        {habits && (
          <section className="mt-6">
            <HabitList
              habits={habits}
              onToggle={(h) => setDone(h.id, !h.done_today).then(reload)}
              onCreate={(name) => createHabit(name).then(reload)}
            />
          </section>
        )}
        {week && (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <WeekChart
              title="Sleep"
              unit="h"
              color="#ffb48f"
              data={week.days.map((d) => ({
                day: d.day,
                value: d.sleep_minutes === null ? null : Number((d.sleep_minutes / 60).toFixed(1)),
              }))}
            />
            <WeekChart
              title="Steps"
              unit="steps"
              data={week.days.map((d) => ({ day: d.day, value: d.steps }))}
            />
            <WeekChart
              title="Calories"
              unit="kcal"
              color="#f47b63"
              data={week.days.map((d) => ({ day: d.day, value: d.calories }))}
            />
          </section>
        )}
        {badges && (
          <section className="mt-6">
            <Badges {...badges} />
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
