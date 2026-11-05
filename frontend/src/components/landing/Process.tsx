"use client";

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Reveal from "./Reveal";

// Three steps along a line that fills as you scroll, with a lime dot at its
// head. A step turns solid when the line reaches it. This one really is a
// sequence, so the numbers stay.
export default function Process() {
  const { c } = useCopy();
  const p = c.process;
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const steps = p.steps.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      setActive(steps);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the section's top reaches 65% of the screen, 1 when its bottom reaches 70%.
      const t = Math.min(Math.max((vh * 0.65 - r.top) / (r.height - vh * 0.05), 0), 1);
      el.style.setProperty("--p", t.toFixed(3));
      setActive(Math.min(steps, Math.floor(t * steps + 0.3) + (t > 0.02 ? 1 : 0)));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(frame);
    };
  }, [p.steps.length]);

  return (
    <section ref={section} id="how" className="bg-subtle px-4 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
        <div className="md:sticky md:top-32 md:self-start">
          <Reveal as="h2" className="text-[clamp(38px,5.4vw,76px)] font-medium leading-[1.02] tracking-[-0.045em]">
            {p.title}
          </Reveal>
          <Reveal as="p" delay={100} className="mt-6 max-w-sm text-lg leading-snug text-fg-muted">
            {p.lead}
          </Reveal>
        </div>

        <ol className="relative space-y-20 pl-10 sm:space-y-28 sm:pl-14">
          {/* The track and the line that fills it. */}
          <span className="absolute bottom-2 left-[7px] top-2 w-px bg-line-strong" aria-hidden="true">
            <span className="vl-trail absolute inset-0 w-[2px] -translate-x-[0.5px] bg-accent" />
            <span className="vl-head absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-lime shadow-glow" />
          </span>

          {p.steps.map((s, i) => (
            <li key={s.title} className={cx("vl-step relative", active > i && "is-on")}>
              <span className="vl-step-dot absolute -left-[41px] top-[9px] h-3.5 w-3.5 rounded-full border-2 border-line-strong bg-subtle sm:-left-[57px]" />
              <div className="vl-step-body">
                <p className="text-caption tabular-nums text-fg-subtle">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-[clamp(26px,2.8vw,36px)] font-medium leading-[1.1] tracking-[-0.035em]">{s.title}</h3>
                <p className="mt-3 max-w-md text-lg leading-snug text-fg-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
