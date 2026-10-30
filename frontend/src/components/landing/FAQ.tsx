"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <SplitHeading text="Questions, answered" className="text-3xl font-semibold tracking-tight sm:text-5xl" />
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={q} delay={i * 70}>
                <div
                  className={`rounded-2xl border bg-card/60 transition-colors ${isOpen ? "border-accent/30" : "border-white/5 hover:border-white/15"}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                  >
                    <span className="font-medium sm:text-lg">{q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-accent transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div id={`faq-${i}`} className={`accordion ${isOpen ? "is-open" : ""}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 leading-relaxed text-slate-400 sm:px-6 sm:pb-6">{a}</p>
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
