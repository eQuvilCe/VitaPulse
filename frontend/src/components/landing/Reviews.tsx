"use client";

import { Quote, Star } from "lucide-react";

import { Badge } from "@/components/ui";
import { useCopy } from "./copy";
import Reveal from "./Reveal";

const AVATARS = ["from-kcal-300 to-kcal-500", "from-brand-300 to-brand-600", "from-warn/60 to-kcal-300"];

// Placeholder stories until real reviews come in.
export default function Reviews() {
  const { c } = useCopy();

  return (
    <section className="px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Reveal as="p" className="vl-eyebrow">
            {c.reviews.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={100} className="vl-display mt-3 text-[clamp(32px,4.6vw,52px)] leading-[1.06] text-fg [text-wrap:balance]">
            {c.reviews.title}
          </Reveal>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {c.reviews.items.map((r, i) => (
            <Reveal key={r.name} delay={i * 120}>
              <figure className="flex h-full flex-col rounded-panel border border-line bg-surface p-6 shadow-card sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-warn" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="h-6 w-6 text-brand-100" aria-hidden="true" />
                </div>
                <blockquote className="mt-4 flex-1 text-body text-fg [text-wrap:pretty]">{r.text}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-serif text-lg text-white ${AVATARS[i]}`}
                    aria-hidden="true"
                  >
                    {r.name[0]}
                  </span>
                  <span className="flex-1 text-body font-semibold text-fg">{r.name}</span>
                  <Badge tone="brand">{r.result}</Badge>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
