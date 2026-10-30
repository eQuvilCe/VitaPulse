import Link from "next/link";
import HeroField from "./HeroFieldLazy";
import LiveMetrics from "./LiveMetrics";

export default function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-plum pb-16 pt-32 sm:pb-24">
      <div className="hero-glow absolute inset-0 -z-20" aria-hidden="true" />
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <HeroField />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-plum/80 via-plum/30 to-transparent lg:w-2/3" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-plum to-transparent" />

      <div className="mx-auto grid w-full max-w-6xl items-end gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p
            className="hero-in inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] text-mist backdrop-blur"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            <span className="beat-dot h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
            Your gentle AI health companion
          </p>
          <h1
            className="hero-in display mt-6 max-w-4xl text-[clamp(48px,8vw,108px)] leading-[0.98] text-glow [text-wrap:balance]"
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            Your body has a rhythm. <em className="text-gradient-warm">Learn&nbsp;it.</em>
          </h1>
          <p
            className="hero-in mt-7 max-w-xl text-lg leading-relaxed text-mist [text-wrap:pretty] sm:text-xl"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            Sleep, water, steps, food and habits in one calm daily view — with a coach that notices
            the patterns and suggests one kind, small change for today.
          </p>
          <div className="hero-in mt-10 flex flex-wrap items-center gap-3" style={{ "--d": "270ms" } as React.CSSProperties}>
            <Link href="/register" className="btn-warm rounded-full px-8 py-4 text-base font-semibold">
              Start free
            </Link>
            <a href="#how" className="btn-ghost group flex items-center gap-2 rounded-full px-7 py-4 text-base font-medium text-glow">
              See how it works
              <span className="transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
        </div>
        <div className="hero-in w-full lg:w-[380px]" style={{ "--d": "360ms" } as React.CSSProperties}>
          <LiveMetrics />
        </div>
      </div>
    </section>
  );
}
