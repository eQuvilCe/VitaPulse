import Reveal from "./Reveal";
import { ecgPath } from "./rhythm";

const SLEEP = [
  { stage: "Deep", w: 22, tone: "bg-mint" },
  { stage: "REM", w: 24, tone: "bg-mint/60" },
  { stage: "Light", w: 46, tone: "bg-mint/25" },
  { stage: "Awake", w: 8, tone: "bg-white/15" },
];

// A static mock of the daily dashboard — the product, not a picture of it.
export default function DashboardPreview() {
  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[clamp(36px,5.4vw,72px)] font-semibold leading-[0.95] tracking-[-0.03em] text-bone [text-wrap:balance]">
            Your day, at a glance.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-sage">One screen every morning. Nothing to configure.</p>
        </Reveal>

        <Reveal delay={150} className="mt-14">
          <div className="dash-glow relative rounded-[28px] border border-white/10 bg-deep/90 p-3 sm:p-4">
            <div className="flex items-center justify-between px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sage">
              <span>Today · Thu 30 Oct</span>
              <span className="flex items-center gap-2 text-mint">
                <span className="beat-dot h-1.5 w-1.5 rounded-full bg-coral" />
                Live
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl bg-night p-5 sm:p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-sage">Heart rate</p>
                  <p className="font-mono text-3xl text-bone">
                    61<span className="ml-1 text-sm text-sage">bpm</span>
                  </p>
                </div>
                <svg viewBox="0 0 600 120" className="mt-4 h-28 w-full" preserveAspectRatio="none" aria-hidden="true">
                  <path d={ecgPath(600, 120, 6)} fill="none" stroke="#6ff2c2" strokeWidth="1.75" vectorEffect="non-scaling-stroke" className="dash-trace" pathLength={1} />
                </svg>
                <div className="mt-3 flex justify-between font-mono text-[10px] text-sage">
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>Now</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl bg-night p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-sage">Sleep</p>
                    <p className="font-mono text-xl text-bone">7h 42m</p>
                  </div>
                  <div className="mt-4 flex h-2.5 gap-1 overflow-hidden rounded-full">
                    {SLEEP.map((s) => (
                      <span key={s.stage} className={s.tone} style={{ width: `${s.w}%` }} />
                    ))}
                  </div>
                  <div className="mt-2.5 flex justify-between font-mono text-[10px] text-sage">
                    {SLEEP.map((s) => (
                      <span key={s.stage}>{s.stage}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-night p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-sage">Water</p>
                    <p className="font-mono text-xl text-bone">
                      1.8<span className="text-sm text-sage"> / 2.5 L</span>
                    </p>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[72%] rounded-full bg-mint" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                ["Steps", "8 214"],
                ["Calories", "1 940"],
                ["Habits", "4 / 5"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-night px-3.5 py-4 sm:px-5">
                  <p className="text-xs text-sage sm:text-sm">{k}</p>
                  <p className="mt-1 font-mono text-base text-bone sm:text-xl">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3 rounded-2xl border border-mint/20 bg-mint/[0.06] p-5">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mint shadow-[0_0_10px_#6ff2c2]" />
              <p className="text-[15px] leading-relaxed text-bone">
                <span className="font-semibold">Coach:</span> you sleep 40 minutes longer on days you pass 8k
                steps. A 10-minute walk after lunch should get you there today.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
