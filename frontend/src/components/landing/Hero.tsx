"use client";

import { ArrowDown, Camera, Check, Flame, Sparkles } from "lucide-react";

import { Badge, Progress, buttonClasses } from "@/components/ui";
import { useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import { ecgPath } from "./rhythm";

const PULSE = ecgPath(1440, 140, 4);
const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function Hero() {
  const { c, locale } = useCopy();
  const h = c.hero;

  return (
    <section id="top" className="relative isolate overflow-hidden pb-16 pt-28 sm:pt-36 lg:pb-28">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="vl-blob -right-24 -top-24 h-[420px] w-[420px] bg-brand-100" />
        <div className="vl-blob -left-32 top-1/3 h-[360px] w-[360px] bg-kcal-100/80" style={{ animationDelay: "-6s" }} />
        <div className="vl-blob bottom-0 right-1/3 h-[300px] w-[300px] bg-brand-50" style={{ animationDelay: "-12s" }} />
        {/* The intro's pulse carries on, faintly, across the hero. */}
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full text-brand-300">
          <path d={PULSE} pathLength={1} className="vl-draw is-hero" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.55" />
        </svg>
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div>
          <p className="vl-in" style={d(0)}>
            <Badge tone="brand" className="px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {h.badge}
            </Badge>
          </p>
          <h1 className="vl-in vl-display mt-5 text-[clamp(40px,6.6vw,78px)] leading-[1.02] text-fg [text-wrap:balance]" style={d(120)}>
            {h.titleA} <em>{h.titleB}</em>
          </h1>
          <p className="vl-in mt-6 max-w-xl text-lead text-fg-muted [text-wrap:pretty]" style={d(240)}>
            {h.lead}
          </p>
          <div className="vl-in mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap" style={d(360)}>
            <a href="#plan" className={buttonClasses({ size: "lg", className: "px-8" })}>
              {h.primary}
            </a>
            <a href="#how" className={buttonClasses({ variant: "secondary", size: "lg", className: "group px-7" })}>
              {h.secondary}
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </div>
          <ul className="vl-in mt-7 flex flex-wrap gap-x-5 gap-y-2 text-caption font-medium text-fg-muted" style={d(480)}>
            {h.trust.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="vl-in relative mx-auto h-[400px] w-full max-w-[520px] sm:h-[500px]" style={d(300)}>
          <Photo
            id={PHOTOS.bowl}
            alt={h.photoFood}
            width={480}
            height={520}
            priority
            sizes="(min-width: 1024px) 400px, 80vw"
            className="absolute right-0 top-0 h-[86%] w-[80%] rounded-[32px] shadow-raised"
          />
          <Photo
            id={PHOTOS.crunches}
            alt={h.photoWorkout}
            width={300}
            height={260}
            priority
            sizes="240px"
            className="absolute bottom-0 left-0 h-[44%] w-[48%] rounded-[24px] border-4 border-canvas shadow-raised"
          />

          <div className="vl-float absolute left-0 top-8 w-[210px] rounded-card border border-line bg-surface/95 p-3.5 shadow-raised backdrop-blur sm:left-[-12px]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kcal-100 text-kcal-700">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{h.scanLabel}</p>
                <p className="truncate text-caption font-bold text-fg">{h.scanDish}</p>
              </div>
            </div>
            <p className="mt-2.5 font-serif text-2xl text-fg">
              {(480).toLocaleString(locale)} <span className="font-sans text-caption text-fg-muted">{c.units.kcal}</span>
            </p>
            <div className="mt-1.5 flex gap-1.5 text-[11px] font-semibold">
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-800">{c.quiz.protein[0]} 22</span>
              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-warn-strong">{c.quiz.fat[0]} 18</span>
              <span className="rounded-full bg-info-soft px-2 py-0.5 text-info">{c.quiz.carbs[0]} 54</span>
            </div>
          </div>

          <div
            className="vl-float absolute right-3 top-[-14px] flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-bold text-fg shadow-raised"
            style={{ animationDelay: "-2s" }}
          >
            <Flame className="h-4 w-4 text-kcal-500" aria-hidden="true" />
            {h.streak}
          </div>

          <div
            className="vl-float absolute bottom-[18%] right-[-4px] hidden w-[190px] rounded-card border border-line bg-surface/95 p-3.5 shadow-raised backdrop-blur sm:block"
            style={{ animationDelay: "-4s" }}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-caption font-semibold text-fg-muted">{h.bmiLabel}</p>
              <Badge tone="brand">{h.bmiState}</Badge>
            </div>
            <p className="mt-1 font-serif text-3xl text-fg">{(22.8).toLocaleString(locale)}</p>
            <div className="relative mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              <span className="w-[14%] bg-info/60" />
              <span className="w-[26%] bg-brand-500" />
              <span className="w-[20%] bg-warn/70" />
              <span className="flex-1 bg-kcal-500/70" />
            </div>
            <span className="relative -mt-2.5 block h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-700 shadow-card" style={{ left: "29%" }} />
          </div>

          <div
            className="vl-float absolute bottom-3 right-[8%] w-[200px] rounded-card border border-line bg-surface/95 p-3.5 shadow-raised backdrop-blur sm:right-[26%]"
            style={{ animationDelay: "-1s" }}
          >
            <Progress tone="calorie" value={1240} max={1850} label={h.todayLabel} valueText={h.todayValue} showLabel size="sm" />
          </div>
        </div>
      </div>
    </section>
  );
}
