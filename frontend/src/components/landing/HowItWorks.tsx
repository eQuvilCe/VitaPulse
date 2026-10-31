"use client";

import { Camera, ClipboardList, Sparkles, TrendingUp } from "lucide-react";

import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Reveal from "./Reveal";

const ICONS = [ClipboardList, Sparkles, Camera, TrendingUp];
const TONES = [
  "bg-brand-100 text-brand-800",
  "bg-info-soft text-info",
  "bg-kcal-100 text-kcal-700",
  "bg-warn-soft text-warn-strong",
];

export default function HowItWorks() {
  const { c } = useCopy();

  return (
    <section id="how" className="relative bg-surface px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Reveal as="p" className="vl-eyebrow">
            {c.how.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={100} className="vl-display mt-3 text-[clamp(32px,4.6vw,52px)] leading-[1.06] text-fg [text-wrap:balance]">
            {c.how.title}
          </Reveal>
        </div>

        <div className="mt-14">
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.how.steps.map((step, i) => {
              const Icon = ICONS[i];
              return (
                <Reveal as="li" key={step.title} delay={i * 120} className="relative">
                  <div className="relative flex h-full flex-col rounded-card border border-line bg-canvas p-6 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-raised">
                    <div className="flex items-center justify-between">
                      <span className={cx("flex h-14 w-14 items-center justify-center rounded-2xl", TONES[i])}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="font-serif text-3xl text-line-strong">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 text-heading text-fg">{step.title}</h3>
                    <p className="mt-2 flex-1 text-body text-fg-muted">{step.text}</p>
                    <p className="mt-5 text-caption font-semibold text-brand-700">{step.tag}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
