"use client";

import { useEffect, useState } from "react";

import { cx } from "@/lib/cx";

// A heartbeat drawn across the page: a flat line with a few blips.
const D =
  "M0 70H250l16-6 12 6h20l12-4 10 4h60l8 0 12-56 18 104 14-74 10 26h120l14-6 12 6h70l10 0 12-48 16 92 12-60 8 16h120l16-6 12 6h20l12-4 10 4h260l10 0 12-52 16 100 12-66 10 22H1420";

type Props = {
  // Unique per page: the travelling dot follows the path with this id.
  id: string;
  className?: string;
  // true: a dot runs along the line again and again. false: it rests at the end and breathes.
  travel?: boolean;
};

// The line draws itself once (on load, or when it scrolls into view inside a
// Reveal), then a lime dot keeps it alive. Reduced-motion visitors get the
// finished line and a still dot.
export default function PulseLine({ id, className, travel = true }: Props) {
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotion(!q.matches);
    const on = () => setMotion(!q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  return (
    <svg viewBox="0 0 1440 120" className={cx("block aspect-[1440/120] w-full overflow-visible", className)} aria-hidden="true">
      <path
        id={id}
        d={D}
        pathLength={1}
        className="vl-pulse-path"
        fill="none"
        stroke="rgb(var(--vh-accent-2))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {travel && motion && (
        <g opacity="0">
          <circle r="18" fill="rgb(var(--vh-halo))" opacity="0.3" />
          <circle r="5.5" fill="rgb(var(--vh-lime))" stroke="rgb(var(--vh-accent))" strokeWidth="2" />
          <animateMotion dur="7s" begin="3.2s" repeatCount="indefinite" rotate="0">
            <mpath href={`#${id}`} />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1" dur="7s" begin="3.2s" repeatCount="indefinite" />
        </g>
      )}
      {!travel && (
        <g transform="translate(1420 74)">
          <circle r="18" fill="rgb(var(--vh-halo))" opacity="0.3" className={motion ? "vl-beat" : undefined} />
          <circle r="5.5" fill="rgb(var(--vh-lime))" stroke="rgb(var(--vh-accent))" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}
