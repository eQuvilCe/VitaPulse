"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  { q: "Is Vita Health free?", a: "Yes. Tracking, the dashboard and coach tips are free while we are in early access." },
  { q: "Do I need a fitness tracker?", a: "No. You can log everything by hand in a few taps. Device sync is on our roadmap." },
  {
    q: "How does the AI coach work?",
    a: "It looks at your own sleep, water, steps, meals and habits over time and suggests one small, specific change for today.",
  },
  { q: "Is my health data private?", a: "Your data is tied to your account, sent over HTTPS and never sold or shared with advertisers." },
  { q: "Is this medical advice?", a: "No. Vita Health helps you build healthy routines. For medical questions, please talk to a doctor." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 bg-cream px-5 pb-36 pt-24 text-ink sm:px-8 sm:pt-32">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <Reveal as="p" className="eyebrow text-coral">FAQ</Reveal>
          <Reveal as="h2" delay={140} className="display mt-4 text-[clamp(40px,5.6vw,64px)] leading-[1.02]">
            Questions, <em>kindly answered</em>
          </Reveal>
        </div>
        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={q} delay={i * 130}>
                <div className={`rounded-[24px] border transition-[background-color,border-color,box-shadow] duration-500 ${isOpen ? "border-ink/[0.06] bg-white shadow-soft" : "border-transparent bg-cream-2/70 hover:bg-white/70"}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-6 rounded-[24px] px-6 py-5 text-left"
                >
                  <span className="text-lg font-semibold">{q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "rotate-45 bg-coral text-white" : "bg-white text-coral"}`}
                    aria-hidden="true"
                  >
                    <span className="relative h-3 w-3">
                      <span className="absolute left-0 top-1/2 h-0.5 w-3 -translate-y-1/2 rounded-full bg-current" />
                      <span className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                    </span>
                  </span>
                </button>
                <div id={`faq-${i}`} className={`accordion ${isOpen ? "is-open" : ""}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-xl px-6 pb-6 leading-relaxed text-ink-soft">{a}</p>
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
