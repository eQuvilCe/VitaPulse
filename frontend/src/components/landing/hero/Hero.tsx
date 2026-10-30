import Link from "next/link";
import HeroField from "./HeroFieldLazy";
import LiveMetrics from "./LiveMetrics";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-14 pt-28 sm:pb-20">
      <div className="hero-glow absolute inset-0 -z-20" aria-hidden="true" />
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <HeroField />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-night to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-night/75 via-night/25 to-transparent lg:w-2/3" />

      <div className="mx-auto grid w-full max-w-7xl items-end gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="hero-in flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mint" style={{ "--d": "0ms" } as React.CSSProperties}>
            <span className="beat-dot h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
            AI health OS
          </p>
          <h1
            className="hero-in mt-5 max-w-4xl font-display text-[clamp(44px,8.2vw,112px)] font-semibold leading-[0.92] tracking-[-0.035em] text-bone [text-wrap:balance]"
            style={{ "--d": "80ms" } as React.CSSProperties}
          >
            Your body has a rhythm. Learn&nbsp;it.
          </h1>
          <p
            className="hero-in mt-6 max-w-xl text-lg leading-relaxed text-sage [text-wrap:pretty]"
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            Sleep, water, steps, food and habits in one daily pulse — and an AI coach that reads the
            pattern and tells you what to change today.
          </p>
          <div className="hero-in mt-9 flex flex-wrap items-center gap-3" style={{ "--d": "240ms" } as React.CSSProperties}>
            <Link
              href="/register"
              className="rounded-full bg-mint px-7 py-3.5 font-semibold text-night shadow-[0_0_40px_-6px_rgba(111,242,194,0.6)] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
            >
              Start free
            </Link>
            <a
              href="#how"
              className="rounded-full border border-white/15 px-7 py-3.5 font-medium text-bone transition-colors hover:border-white/30 hover:bg-white/5"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="hero-in w-full lg:w-[400px]" style={{ "--d": "320ms" } as React.CSSProperties}>
          <LiveMetrics />
        </div>
      </div>
    </section>
  );
}
