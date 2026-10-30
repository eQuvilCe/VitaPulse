"use client";

import { useEffect, useState } from "react";
import { BEAT_MS } from "../rhythm";

const BPM_DRIFT = [61, 62, 62, 61, 60, 59, 60, 61, 63, 62];

// Readouts that tick with the page's 60 BPM heartbeat.
export default function LiveMetrics() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % BPM_DRIFT.length), BEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] font-mono text-bone backdrop-blur-md">
      <div className="bg-night/80 px-4 py-3.5 sm:px-5">
        <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-sage">
          <span className="beat-dot h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
          Heart
        </dt>
        <dd className="mt-1.5 text-xl tabular-nums sm:text-2xl">
          {BPM_DRIFT[i]}
          <span className="ml-1 text-xs text-sage">bpm</span>
        </dd>
      </div>
      <div className="bg-night/80 px-4 py-3.5 sm:px-5">
        <dt className="text-[10px] uppercase tracking-[0.14em] text-sage">Sleep</dt>
        <dd className="mt-1.5 text-xl tabular-nums sm:text-2xl">
          7<span className="text-xs text-sage">h</span> 42<span className="text-xs text-sage">m</span>
        </dd>
      </div>
      <div className="bg-night/80 px-4 py-3.5 sm:px-5">
        <dt className="text-[10px] uppercase tracking-[0.14em] text-sage">HRV</dt>
        <dd className="mt-1.5 text-xl tabular-nums sm:text-2xl">
          68<span className="ml-1 text-xs text-sage">ms</span>
        </dd>
      </div>
    </dl>
  );
}
