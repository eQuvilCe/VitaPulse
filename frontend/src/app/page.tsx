import { Activity } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Activity className="h-10 w-10 text-accent" />
      <h1 className="text-3xl font-semibold">VitaPulse</h1>
      <p className="text-slate-400">Your AI Health OS</p>
      <Link href="/dashboard" className="rounded-xl bg-accent px-5 py-2 font-medium text-bg">
        Open dashboard
      </Link>
    </main>
  );
}
