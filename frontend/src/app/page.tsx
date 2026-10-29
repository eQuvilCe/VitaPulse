import { Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Activity className="h-10 w-10 text-accent" />
      <h1 className="text-3xl font-semibold">VitaPulse</h1>
      <p className="text-slate-400">Your AI Health OS</p>
    </main>
  );
}
