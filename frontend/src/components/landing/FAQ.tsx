"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  { q: "Is VitaPulse free?", a: "Yes. Tracking, the dashboard and coach tips are free while we are in early access." },
  { q: "Do I need a fitness tracker?", a: "No. You can log everything by hand in a few taps. Device sync is on our roadmap." },
  {
    q: "How does the AI coach work?",
    a: "It looks at your own sleep, water, steps, meals and habits over time and suggests one small, specific change for today.",
  },
  { q: "Is my health data private?", a: "Your data is tied to your account, sent over HTTPS and never sold or shared with advertisers." },
  { q: "Is this medical advice?", a: "No. VitaPulse helps you build healthy routines. For medical questions, please talk to a doctor." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-16 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.4fr]">
        <Reveal as="h2" className="font-display text-[clamp(36px,5.4vw,72px)] font-semibold leading-[0.95] tracking-[-0.03em] text-bone">
          Questions.
        </Reveal>
        <div className="border-t border-white/10">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={q} delay={i * 60} className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-lg font-medium text-bone sm:text-xl">{q}</span>
                  <span
                    className={`relative h-4 w-4 shrink-0 text-mint transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    aria-hidden="true"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-4 bg-current" />
                    <span className="absolute left-1/2 top-0 h-4 w-px bg-current" />
                  </span>
                </button>
                <div id={`faq-${i}`} className={`accordion ${isOpen ? "is-open" : ""}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-7 leading-relaxed text-sage">{a}</p>
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
