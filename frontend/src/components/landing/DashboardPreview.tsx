import { Droplets, Footprints, Moon, Repeat, Sparkles } from "lucide-react";
import Reveal from "./Reveal";

const SLEEP = [
  { stage: "Deep", w: 22, tone: "bg-[#8f7cc8]" },
  { stage: "REM", w: 24, tone: "bg-[#b9a7ea]" },
  { stage: "Light", w: 46, tone: "bg-white/25" },
  { stage: "Awake", w: 8, tone: "bg-peach" },
];

// Smooth heart-rate curve for the day (no jagged ECG here — this is a summary).
const HR = [64, 61, 58, 57, 62, 74, 81, 72, 69, 78, 92, 84, 71, 66, 70, 63];
function hrPath(w: number, h: number) {
  const max = 100;
  const min = 50;
  const pts = HR.map((v, i) => [(i / (HR.length - 1)) * w, h - ((v - min) / (max - min)) * h] as const);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

function Ring({ value, color, children }: { value: number; color: string; children: React.ReactNode }) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" pathLength={1} strokeDasharray={`${value} 1`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  );
}

// A mock of the daily dashboard — the product itself, not a picture of it.
export default function DashboardPreview() {
  const line = hrPath(600, 140);
  return (
    <section id="dashboard" className="sheet relative z-20 -mt-12 bg-cream px-5 pb-12 pt-24 text-ink sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal as="p" className="eyebrow text-coral">Your dashboard</Reveal>
          <Reveal as="h2" delay={140} className="display mt-4 text-[clamp(40px,5.6vw,72px)] leading-[1.02] [text-wrap:balance]">
            Your day, <em>at a glance</em>
          </Reveal>
          <Reveal as="p" delay={280} className="mt-5 text-lg leading-relaxed text-ink-soft">
            One calm screen every morning. Nothing to configure.
          </Reveal>
        </div>

        <Reveal delay={320} className="mt-16">
          <div className="dash-window relative overflow-hidden rounded-[36px] bg-plum p-3 text-glow sm:p-4">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-coral/25 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-mint/15 blur-3xl" aria-hidden="true" />

            <div className="relative flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[13px] text-mist">Good morning, Alex</p>
                <p className="font-serif text-2xl">Thursday, 30 October</p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-xs text-mist">
                <span className="beat-dot h-2 w-2 rounded-full bg-coral" />
                Synced
              </span>
            </div>

            <div className="relative grid gap-3 lg:grid-cols-[1.55fr_1fr]">
              <div className="rounded-[26px] bg-white/[0.06] p-5 sm:p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-mist">Heart rate today</p>
                    <p className="mt-1 font-serif text-4xl tabular-nums">
                      61 <span className="font-sans text-sm text-mist">bpm resting</span>
                    </p>
                  </div>
                  <p className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-mint">−3 vs last week</p>
                </div>
                <svg viewBox="0 0 600 150" className="mt-5 h-32 w-full sm:h-36" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="hr-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#f47b63" stopOpacity="0.45" />
                      <stop offset="1" stopColor="#f47b63" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="hr-line" x1="0" x2="1">
                      <stop offset="0" stopColor="#ffb48f" />
                      <stop offset="1" stopColor="#f47b63" />
                    </linearGradient>
                  </defs>
                  <path d={`${line} L600 150 L0 150 Z`} fill="url(#hr-fill)" />
                  <path d={line} fill="none" stroke="url(#hr-line)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" className="dash-trace" pathLength={1} />
                </svg>
                <div className="mt-2 flex justify-between text-[11px] text-mist">
                  <span>6 am</span>
                  <span>Noon</span>
                  <span>6 pm</span>
                  <span>Now</span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[26px] bg-white/[0.06] p-5">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm text-mist">
                      <Moon className="h-4 w-4 text-[#b9a7ea]" aria-hidden="true" /> Sleep
                    </p>
                    <p className="font-serif text-2xl tabular-nums">7h 42m</p>
                  </div>
                  <div className="mt-4 flex h-3 gap-1">
                    {SLEEP.map((s) => (
                      <span key={s.stage} className={`rounded-full ${s.tone}`} style={{ width: `${s.w}%` }} />
                    ))}
                  </div>
                  <div className="mt-2.5 flex justify-between text-[11px] text-mist">
                    {SLEEP.map((s) => (
                      <span key={s.stage}>{s.stage}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-[26px] bg-white/[0.06] p-4">
                    <Ring value={0.72} color="#86d9c2">
                      <Droplets className="h-5 w-5 text-mint" aria-hidden="true" />
                    </Ring>
                    <div>
                      <p className="text-[12px] text-mist">Water</p>
                      <p className="text-lg font-semibold tabular-nums">1.8 L</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[26px] bg-white/[0.06] p-4">
                    <Ring value={0.82} color="#f47b63">
                      <Footprints className="h-5 w-5 text-coral" aria-hidden="true" />
                    </Ring>
                    <div>
                      <p className="text-[12px] text-mist">Steps</p>
                      <p className="text-lg font-semibold tabular-nums">8,214</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-3 grid gap-3 sm:grid-cols-[1fr_1.6fr]">
              <div className="flex items-center gap-3 rounded-[26px] bg-white/[0.06] p-5">
                <Repeat className="h-5 w-5 text-peach" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm text-mist">Habits</p>
                  <div className="mt-2 flex gap-1.5">
                    {[1, 1, 1, 1, 0].map((done, i) => (
                      <span key={i} className={`h-2 flex-1 rounded-full ${done ? "bg-peach" : "bg-white/15"}`} />
                    ))}
                  </div>
                </div>
                <p className="font-semibold tabular-nums">4/5</p>
              </div>
              <div className="flex gap-4 rounded-[26px] bg-gradient-to-br from-peach/25 to-coral/15 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-peach to-coral text-plum">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-[15px] leading-relaxed">
                  You sleep 40 minutes longer on days you pass 8k steps. A 10-minute walk after lunch
                  should get you there today.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
