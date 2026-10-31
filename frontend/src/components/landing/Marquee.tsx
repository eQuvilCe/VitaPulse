"use client";

import { useCopy } from "./copy";

// A slow ribbon of huge words between blocks. The track holds two identical
// halves so sliding by -50% loops without a seam.
export default function Marquee() {
  const { c } = useCopy();
  const half = (
    <span className="flex shrink-0 items-center">
      {[...c.marquee, ...c.marquee].map((word, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 sm:px-10">{word}</span>
          <span aria-hidden="true">
            •
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden border-y border-line py-6 sm:py-8">
      <p className="sr-only">{c.marquee.join(" · ")}</p>
      <div className="vl-marquee font-display text-[clamp(40px,7vw,90px)] uppercase leading-[0.85]" aria-hidden="true">
        {half}
        {half}
      </div>
    </div>
  );
}
