"use client";

import { useState } from "react";

import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Reveal from "./Reveal";

export default function FAQ() {
  const { c } = useCopy();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-surface px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
        <div>
          <Reveal as="p" className="vl-eyebrow">
            {c.faq.eyebrow}
          </Reveal>
          <Reveal as="h2" delay={100} className="vl-display mt-3 text-[clamp(32px,4.6vw,52px)] leading-[1.06] text-fg">
            {c.faq.title}
          </Reveal>
        </div>
        <div className="space-y-3">
          {c.faq.items.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 80}>
                <div
                  className={cx(
                    "rounded-card border transition-[background-color,border-color,box-shadow] duration-500",
                    isOpen ? "border-line bg-canvas shadow-card" : "border-transparent bg-subtle/70 hover:bg-subtle",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      id={`faq-q-${i}`}
                      className="flex w-full items-center justify-between gap-5 rounded-card px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span className="text-body font-semibold text-fg sm:text-lead">{q}</span>
                      <span
                        className={cx(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          isOpen ? "rotate-45 bg-brand-700 text-white" : "bg-surface text-brand-700",
                        )}
                        aria-hidden="true"
                      >
                        <span className="relative h-3 w-3">
                          <span className="absolute left-0 top-1/2 h-0.5 w-3 -translate-y-1/2 rounded-full bg-current" />
                          <span className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                        </span>
                      </span>
                    </button>
                  </h3>
                  <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={cx("vl-accordion", isOpen && "is-open")}>
                    <div className="overflow-hidden">
                      <p className="max-w-xl px-5 pb-5 text-body text-fg-muted sm:px-6 sm:pb-6">{a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
