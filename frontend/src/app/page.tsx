import { Activity } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Activity className="h-10 w-10 text-accent" />
      <h1 className="text-3xl font-semibold">VitaPulse</h1>
      <p className="text-slate-400">Your AI Health OS</p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-lg bg-accent px-4 py-2 font-medium text-bg">
          Sign in
        </Link>
        <Link href="/register" className="rounded-lg border border-white/10 px-4 py-2">
          Sign up
        </Link>
      </div>
    </main>
  );
}
