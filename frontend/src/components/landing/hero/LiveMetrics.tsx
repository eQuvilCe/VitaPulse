"use client";

import { Moon, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { BEAT_MS } from "../rhythm";

const BPM_DRIFT = [61, 62, 62, 61, 60, 59, 60, 61, 63, 62];

// A soft glass card with readouts that tick with the page's 60 BPM heartbeat.
export default function LiveMetrics() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % BPM_DRIFT.length), BEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="glass-card rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-mist">Resting heart rate</p>
          <p className="mt-1 font-serif text-5xl leading-none text-glow tabular-nums">
            {BPM_DRIFT[i]}
            <span className="ml-1.5 font-sans text-sm text-mist">bpm</span>
          </p>
        </div>
        <span className="relative flex h-14 w-14 items-center justify-center" aria-hidden="true">
          <span className="beat-halo absolute inset-0 rounded-full bg-coral/25" />
          <span className="beat-dot h-4 w-4 rounded-full bg-gradient-to-br from-peach to-coral" />
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-[12px] text-mist">
            <Moon className="h-3.5 w-3.5 text-peach" aria-hidden="true" /> Sleep
          </dt>
          <dd className="mt-1 text-lg font-semibold text-glow tabular-nums">7h 42m</dd>
        </div>
        <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-[12px] text-mist">
            <Wind className="h-3.5 w-3.5 text-mint" aria-hidden="true" /> Calm
          </dt>
          <dd className="mt-1 text-lg font-semibold text-glow tabular-nums">HRV 68</dd>
        </div>
      </dl>
    </div>
  );
}
