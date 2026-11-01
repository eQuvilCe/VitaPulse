"use client";

import { useEffect, useState } from "react";

import AppHeader from "@/components/AppHeader";
import GoalsForm from "@/components/GoalsForm";
import PasswordForm from "@/components/PasswordForm";
import ProfileForm from "@/components/ProfileForm";
import { useRequireUser } from "@/hooks/useRequireUser";
import type { Goals } from "@/lib/dashboard";
import { fetchGoals, saveGoals } from "@/lib/goals";
import { changePassword, updateProfile } from "@/lib/profile";

export default function SettingsPage() {
  const user = useRequireUser();
  const [goals, setGoals] = useState<Goals | null>(null);
  const [goalsFailed, setGoalsFailed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals()
        .then(setGoals)
        .catch(() => setGoalsFailed(true));
    }
  }, [user]);

  if (!user) return <main className="min-h-screen bg-plum p-8 text-mist">Loading...</main>;

  return (
    <main className="min-h-screen bg-plum text-glow">
      <div className="mx-auto max-w-4xl p-6">
        <AppHeader />
        <h1 className="mt-12 font-serif text-4xl tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-mist">{user.email}</p>
        <div className="mt-8 space-y-4">
          <ProfileForm user={user} onSave={updateProfile} />
          {goals && <GoalsForm goals={goals} onSave={saveGoals} />}
          {goalsFailed && <p className="text-sm text-coral">Could not load your daily goals.</p>}
          <PasswordForm onSave={changePassword} />
        </div>
      </div>
    </main>
  );
}
