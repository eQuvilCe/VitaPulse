"use client";

import { Bot, Camera, Droplets, Dumbbell, Flame, RotateCcw, ScanLine, Trophy, Utensils } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import Reveal, { useInView } from "./Reveal";

const BADGE_ICONS = [Camera, Flame, Trophy, Dumbbell, Droplets, RotateCcw];
const BADGE_TONES = [
  "bg-kcal-100 text-kcal-700",
  "bg-warn-soft text-warn-strong",
  "bg-brand-100 text-brand-800",
  "bg-info-soft text-info",
  "bg-info-soft text-info",
  "bg-brand-100 text-brand-800",
];

// A made-up but plausible 12-week weigh-in log for the progress chart.
const WEIGHTS = [82.4, 82.1, 81.3, 81.5, 80.6, 80.1, 79.8, 79.2, 79.4, 78.5, 78.1, 77.6];

function weightPath(w: number, h: number) {
  const lo = Math.min(...WEIGHTS) - 0.6;
  const hi = Math.max(...WEIGHTS) + 0.6;
  return WEIGHTS.map((v, i) => {
    const x = (i / (WEIGHTS.length - 1)) * w;
    const y = ((hi - v) / (hi - lo)) * h;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("");
}

function Tile({ className, delay = 0, children }: { className?: string; delay?: number; children: React.ReactNode }) {
  return (
    <Reveal delay={delay} className={cx("flex flex-col overflow-hidden rounded-panel border border-line bg-surface p-6 shadow-card sm:p-7", className)}>
      {children}
    </Reveal>
  );
}

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h3 className="text-heading text-fg">{title}</h3>
      <p className="mt-2 text-body text-fg-muted">{text}</p>
    </>
  );
}

export default function Features() {
  const { c, locale } = useCopy();
  const f = c.features;
  const chart = useRef<HTMLDivElement>(null);
  const chartVisible = useInView(chart);
  const bmi = useRef<HTMLDivElement>(null);
  const bmiVisible = useInView(bmi);
  const n = (v: number) => v.toLocaleString(locale);

  return (
    <section id="features" className="px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Reveal as="p" className="vl-eyebrow">
            {f.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={100} className="vl-display mt-3 text-[clamp(32px,4.6vw,52px)] leading-[1.06] text-fg [text-wrap:balance]">
            {f.title}
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-flow-row-dense md:grid-cols-2 lg:grid-cols-3">
          {/* AI plan */}
          <Tile className="md:col-span-2">
            <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr] sm:items-center">
              <div>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                  <Utensils className="h-5 w-5" aria-hidden="true" />
                </span>
                <Heading title={f.plan.title} text={f.plan.text} />
              </div>
              <ul className="space-y-2.5" aria-hidden="true">
                {f.plan.days.map((day, i) => (
                  <li key={day} className="flex items-center gap-3 rounded-field bg-canvas px-3 py-2.5">
                    <span className="w-8 text-caption font-bold text-brand-700">{day}</span>
                    <span className="flex-1 truncate text-body text-fg">{f.plan.meals[i]}</span>
                    <span className="text-caption tabular-nums text-fg-subtle">
                      {n([320, 540, 480][i])} {c.units.kcal}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-3 rounded-field bg-kcal-50 px-3 py-2.5 text-kcal-700">
                  <Dumbbell className="h-4 w-4" />
                  <span className="text-body font-semibold">{f.plan.workout}</span>
                </li>
              </ul>
            </div>
          </Tile>

          {/* Calorie scan */}
          <Tile className="p-0 sm:p-0 lg:row-span-2" delay={120}>
            <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:flex-1">
              <Photo id={PHOTOS.plate} alt={f.scan.photo} width={420} height={420} sizes="(min-width: 1024px) 360px, 100vw" className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-6 rounded-[22px] border-2 border-white/80" aria-hidden="true">
                <span className="vl-scanline absolute inset-x-3 h-0.5 rounded-full bg-white shadow-[0_0_16px_4px_rgba(255,255,255,0.6)]" />
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-card bg-surface/95 p-3.5 shadow-raised backdrop-blur" aria-hidden="true">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  <ScanLine className="h-3.5 w-3.5 text-kcal-600" />
                  {c.hero.scanLabel}
                </p>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <p className="truncate text-body font-bold text-fg">{f.scan.dish}</p>
                  <p className="shrink-0 font-serif text-xl text-fg">
                    {n(390)} <span className="font-sans text-caption text-fg-muted">{c.units.kcal}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-7">
              <Heading title={f.scan.title} text={f.scan.text} />
            </div>
          </Tile>

          {/* BMI */}
          <Tile delay={80}>
            <Heading title={f.bmi.title} text={f.bmi.text} />
            <div ref={bmi} className="mt-auto pt-8" aria-hidden="true">
              <div className="relative">
                <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                  <span className="w-[14%] bg-info/60" />
                  <span className="w-[26%] bg-brand-500" />
                  <span className="w-[20%] bg-warn/70" />
                  <span className="flex-1 bg-kcal-500/70" />
                </div>
                <span
                  className="vl-marker absolute -top-1 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-fg shadow-card"
                  style={{ left: bmiVisible ? "36%" : "49%" }}
                />
                <span className="absolute -top-1 left-[49%] h-5 w-5 -translate-x-1/2 rounded-full border-2 border-dashed border-fg-subtle" />
              </div>
              <div className="relative mt-3 h-4 text-caption tabular-nums text-fg-subtle">
                {[
                  { v: 18.5, at: "14%" },
                  { v: 25, at: "40%" },
                  { v: 30, at: "60%" },
                ].map((t) => (
                  <span key={t.v} className="absolute -translate-x-1/2" style={{ left: t.at }}>
                    {n(t.v)}
                  </span>
                ))}
              </div>
            </div>
          </Tile>

          {/* AI tips */}
          <Tile delay={160}>
            <Heading title={f.tips.title} text={f.tips.text} />
            <div className="mt-auto space-y-2.5 pt-6 text-body" aria-hidden="true">
              <p className="ml-auto w-fit max-w-[85%] rounded-[18px] rounded-br-md bg-brand-700 px-3.5 py-2 text-white">{f.tips.question}</p>
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                  <Bot className="h-4 w-4" />
                </span>
                <p className="max-w-[88%] rounded-[18px] rounded-bl-md bg-subtle px-3.5 py-2 text-fg">{f.tips.answer}</p>
              </div>
            </div>
          </Tile>

          {/* Progress */}
          <Tile className="md:col-span-2" delay={80}>
            <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr] sm:items-center">
              <div>
                <Heading title={f.progress.title} text={f.progress.text} />
              </div>
              <div ref={chart} className={cx("rounded-card bg-canvas p-4", chartVisible && "is-visible")} aria-hidden="true">
                <div className="flex items-baseline justify-between text-caption">
                  <span className="text-fg-muted">
                    {f.progress.start} · <b className="text-fg">{n(82.4)} {c.units.kg}</b>
                  </span>
                  <Badge tone="brand">−{n(4.8)} {c.units.kg}</Badge>
                </div>
                <svg viewBox="0 0 300 90" className="mt-3 h-24 w-full overflow-visible text-brand-600">
                  <defs>
                    <linearGradient id="vl-weight-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="currentColor" stopOpacity="0.18" />
                      <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${weightPath(300, 80)}L300 90L0 90Z`} fill="url(#vl-weight-fill)" className={cx("transition-opacity delay-1000 duration-1000", chartVisible ? "opacity-100" : "opacity-0")} />
                  <path d={weightPath(300, 80)} pathLength={1} className="vl-draw" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-right text-caption text-fg-muted">
                  {f.progress.now} · <b className="text-fg">{n(77.6)} {c.units.kg}</b>
                </p>
              </div>
            </div>
          </Tile>

          {/* Achievements */}
          <Tile delay={160}>
            <Heading title={f.achievements.title} text={f.achievements.text} />
            <ul className="mt-auto grid grid-cols-3 gap-2 pt-6">
              {f.achievements.badges.map((label, i) => {
                const Icon = BADGE_ICONS[i];
                return (
                  <li key={label} className="flex flex-col items-center gap-1.5 text-center">
                    <span className={cx("flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-surface transition-transform duration-500 hover:-translate-y-1 hover:rotate-6", BADGE_TONES[i])}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-fg-muted">{label}</span>
                  </li>
                );
              })}
            </ul>
          </Tile>
        </div>
      </div>
    </section>
  );
}
