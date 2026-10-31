"use client";

import { ArrowRight, Clock, Flame, Gauge } from "lucide-react";
import { useState } from "react";

import { buttonClasses } from "@/components/ui";
import { cx } from "@/lib/cx";
import { fill, useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import Reveal from "./Reveal";

const RECIPES = [
  { photo: PHOTOS.salmonBowl, kcal: 520, min: 20, protein: 38 },
  { photo: PHOTOS.avocadoToast, kcal: 340, min: 10, protein: 16 },
  { photo: PHOTOS.quinoa, kcal: 430, min: 35, protein: 15 },
  { photo: PHOTOS.yogurt, kcal: 280, min: 5, protein: 18 },
];

const WORKOUTS = [
  { photo: PHOTOS.crunches, min: 15, burns: 120, level: "easy" },
  { photo: PHOTOS.pilates, min: 30, burns: 180, level: "easy" },
  { photo: PHOTOS.deadlift, min: 45, burns: 320, level: "medium" },
  { photo: PHOTOS.running, min: 25, burns: 280, level: "medium" },
] as const;

type Tab = "recipes" | "workouts";

export default function Library() {
  const { c, locale } = useCopy();
  const l = c.library;
  const [tab, setTab] = useState<Tab>("recipes");

  const cards =
    tab === "recipes"
      ? RECIPES.map((r, i) => ({
          ...l.recipes[i],
          photo: r.photo,
          meta: [
            { icon: Flame, text: `${r.kcal.toLocaleString(locale)} ${c.units.kcal}` },
            { icon: Clock, text: `${r.min} ${l.min}` },
          ],
          extra: `${r.protein} ${c.units.g} ${l.protein}`,
        }))
      : WORKOUTS.map((w, i) => ({
          ...l.workouts[i],
          photo: w.photo,
          meta: [
            { icon: Clock, text: `${w.min} ${l.min}` },
            { icon: Gauge, text: l.levels[w.level] },
          ],
          extra: fill(l.burns, { kcal: w.burns }),
        }));

  return (
    <section id="recipes" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Reveal as="p" className="vl-eyebrow">
              {l.eyebrow}
            </Reveal>
            <Reveal as="h2" delay={100} className="vl-display mt-3 text-[clamp(32px,4.6vw,52px)] leading-[1.06] text-fg [text-wrap:balance]">
              {l.title}
            </Reveal>
            <Reveal as="p" delay={200} className="mt-4 text-lead text-fg-muted">
              {l.lead}
            </Reveal>
          </div>
          <Reveal delay={250}>
            <div role="tablist" aria-label={l.title} className="inline-flex gap-1 rounded-full bg-subtle p-1">
              {(["recipes", "workouts"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  id={`tab-${t}`}
                  aria-selected={tab === t}
                  aria-controls="library-panel"
                  onClick={() => setTab(t)}
                  className={cx(
                    "rounded-full px-5 py-2 text-body font-semibold transition-[background-color,color,box-shadow] duration-300",
                    tab === t ? "bg-surface text-brand-800 shadow-card" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {l.tabs[t]}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Phones swipe through the cards; wider screens get a grid. */}
      <div
        id="library-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="vl-noscrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-auto sm:grid sm:max-w-6xl sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-8 lg:grid-cols-4"
      >
        {cards.map((card, i) => (
          <Reveal key={`${tab}-${card.title}`} delay={i * 90} className="w-[76%] shrink-0 snap-start sm:w-auto">
            <article className="group h-full overflow-hidden rounded-card border border-line bg-canvas transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-raised">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Photo
                  id={card.photo}
                  alt=""
                  width={360}
                  height={270}
                  sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 76vw"
                  className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold text-brand-800 shadow-card">
                  {card.tag}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-body font-bold text-fg">{card.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-muted">
                  {card.meta.map(({ icon: Icon, text }) => (
                    <span key={text} className="flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
                      {text}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-caption font-semibold text-kcal-600">{card.extra}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-8">
        <a href="#plan" className={buttonClasses({ variant: "secondary", className: "group" })}>
          {l.cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
