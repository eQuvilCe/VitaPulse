"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchMe, logout, type User } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) return <main className="p-8 text-slate-400">Loading...</main>;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hi, {user.name || user.email}</h1>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>
    </main>
  );
}
