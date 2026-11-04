"use client";

import { useRef, type ReactNode } from "react";

import { cx } from "@/lib/cx";

type Props = { children: ReactNode; className?: string; max?: number };

// Tips a few degrees toward the mouse. Touch and reduced-motion visitors get a
// flat element: nothing to opt out of.
export default function Tilt({ children, className, max = 3 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-(py - 0.5) * 2 * max).toFixed(2)}deg`);
    el.classList.add("is-active");
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-active");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={cx("vl-tilt", className)}>
      {children}
    </div>
  );
}
