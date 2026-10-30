import Link from "next/link";
import { ArrowRight, Droplets, Footprints, Moon, Sparkles } from "lucide-react";
import { PULSE_PATH } from "./pulse";

// Entrance animations are CSS-only and start right after the intro fades
// (see .hero-in in globals.css).
export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      <div className="hero-aurora" aria-hidden="true" />
      <svg
        className="hero-trace"
        viewBox="0 0 600 120"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={PULSE_PATH} pathLength={1} className="trace-base" />
        <path d={PULSE_PATH} pathLength={1} className="trace-run" />
      </svg>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="text-center lg:text-left">
          <p
            className="hero-in inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Your AI Health OS
          </p>
          <h1
            className="hero-in mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            Your whole health, <span className="text-gradient">in one pulse.</span>
          </h1>
          <p
            className="hero-in mx-auto mt-6 max-w-xl text-lg text-slate-400 lg:mx-0"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            Sleep, water, steps, food and habits in a single daily dashboard — with an AI coach
            that notices patterns and tells you what to do next.
          </p>
          <div
            className="hero-in mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            style={{ "--d": "270ms" } as React.CSSProperties}
          >
            <Link
              href="/register"
              className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-bg shadow-[0_10px_40px_-10px_rgba(52,211,153,0.7)] transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-7 py-3.5 font-medium text-slate-200 transition-colors hover:border-white/25 hover:bg-white/5 sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="hero-in relative mx-auto w-full max-w-md" style={{ "--d": "360ms" } as React.CSSProperties}>
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

const RINGS = [
  { label: "Sleep", value: "7h 40m", pct: 0.86, color: "#a78bfa", Icon: Moon },
  { label: "Water", value: "1.8 L", pct: 0.72, color: "#38bdf8", Icon: Droplets },
  { label: "Steps", value: "8 214", pct: 0.82, color: "#34d399", Icon: Footprints },
];

function DashboardPreview() {
  return (
    <div className="float-slow rounded-3xl border border-white/10 bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Today</p>
          <p className="mt-1 text-lg font-semibold">Health score</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold text-accent">84</span>
          <span className="text-sm text-slate-500">/100</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {RINGS.map(({ label, value, pct, color, Icon }) => (
          <div key={label} className="flex flex-col items-center rounded-2xl bg-white/[0.03] p-3">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={1}
                  className="ring-fill"
                  style={{ "--pct": pct } as React.CSSProperties}
                />
              </svg>
              <Icon className="absolute inset-0 m-auto h-5 w-5" style={{ color }} />
            </div>
            <p className="mt-2 text-sm font-medium">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-accent/15 bg-accent/[0.06] p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <p className="text-sm leading-relaxed text-slate-300">
          You sleep 40 min longer on days you hit 8k steps. A short walk after lunch should get you
          there today.
        </p>
      </div>
    </div>
  );
}
