"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Logo from "@/components/landing/Logo";
import { fetchMe, logout, type User } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

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
      </div>
    </main>
  );
}
