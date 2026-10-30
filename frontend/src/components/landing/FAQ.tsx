"use client";

import { useState } from "react";
import Hex from "./Hex";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const FAQS = [
  {
    q: "Is VitaPulse free?",
    a: "Yes. Tracking, the dashboard and coach tips are free while we are in early access.",
  },
  {
    q: "Do I need a fitness tracker?",
    a: "No. You can log everything by hand in a few taps. Device sync is on our roadmap.",
  },
  {
    q: "How does the AI coach work?",
    a: "It looks at your own sleep, water, steps, meals and habits over time and suggests one small, specific change for today.",
  },
  {
    q: "Is my health data private?",
    a: "Your data is tied to your account, sent over HTTPS and never sold or shared with advertisers.",
  },
  {
    q: "Is this medical advice?",
    a: "No. VitaPulse helps you build healthy routines. For medical questions, please talk to a doctor.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-ink px-5 py-24 text-paper sm:py-32">
      <SplitHeading
        text="Questions"
        className="text-center font-serif text-[clamp(48px,9vw,94px)] font-normal leading-[0.84] tracking-[-0.009em]"
      />

      <div className="mx-auto mt-16 max-w-3xl border-t border-paper/15">
        {FAQS.map(({ q, a }, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={q} delay={i * 60} className="border-b border-paper/15">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-[22px] leading-snug sm:text-[26px]">{q}</span>
                <Hex
                  filled={isOpen}
                  className={`transition-transform duration-500 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
              <div id={`faq-${i}`} className={`accordion ${isOpen ? "is-open" : ""}`}>
                <div className="overflow-hidden">
                  <p className="max-w-xl pb-7 text-[15px] leading-relaxed text-paper/60">{a}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
