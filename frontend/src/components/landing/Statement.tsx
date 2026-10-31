"use client";

import { Camera, LineChart, Sparkles } from "lucide-react";

import { Card } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import Reveal from "./Reveal";

const ICONS = [Sparkles, Camera, LineChart];
// The calorie scan is the one violet block.
const ACCENT = 1;

// One huge centred statement with a small photo set in the line where a word
// would be, a narrow paragraph, then the three features.
export default function Statement() {
  const { c } = useCopy();
  const s = c.statement;

  return (
    <section id="features" className="px-4 py-20 sm:px-8 sm:py-32">
      <Reveal as="h2" className="mx-auto max-w-6xl text-center font-display text-[clamp(44px,9.5vw,120px)] uppercase leading-[0.85]">
        {s.before}{" "}
        <Photo
          id={PHOTOS.bowl}
          alt={s.photo}
          width={240}
          height={130}
          sizes="(min-width: 640px) 220px, 110px"
          className="inline-block h-[0.72em] w-[1.5em] -translate-y-[0.06em] rounded-card align-middle"
        />{" "}
        {s.after}
      </Reveal>
      <Reveal as="p" delay={100} className="mx-auto mt-8 max-w-md text-center text-lg leading-snug text-fg-muted">
        {s.text}
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-6xl gap-4 sm:mt-20 md:grid-cols-3">
        {s.features.map((f, i) => {
          const Icon = ICONS[i];
          const accent = i === ACCENT;
          return (
            <Reveal key={f.tag} delay={i * 80}>
              <Card tone={accent ? "accent" : "surface"} className="flex h-full min-h-[240px] flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-medium opacity-70">{f.tag}</span>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-auto pt-10 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{f.title}</h3>
                <p className={cx("mt-2 text-body", accent ? "text-accent-on/85" : "text-fg-muted")}>{f.text}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
