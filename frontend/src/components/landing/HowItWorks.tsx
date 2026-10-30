"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Reveal from "./Reveal";
import { R_PHASE, ecg } from "./rhythm";

const STEPS = [
  { title: "Create your account", text: "Sign up in under a minute and set goals for sleep, water and steps." },
  { title: "Log your day", text: "Sleep, glasses of water, meals and habit check-ins, each in a couple of taps." },
  { title: "Follow your coach", text: "Your dashboard and AI coach turn the numbers into one clear next step." },
];

const W = 1200;
const H = 180;

// Three beats, shifted so each R peak lands in the middle of a column.
function trace() {
  const shift = R_PHASE - 0.5;
  let d = "";
  for (let i = 0; i <= 900; i++) {
    const s = i / 900;
    const phase = (((s * 3 + shift) % 1) + 1) % 1;
    d += `${i ? "L" : "M"}${(s * W).toFixed(1)} ${(H * 0.66 - ecg(phase) * H * 0.58).toFixed(1)}`;
  }
  return d;
}

// The pulse line draws itself as the section scrolls through the viewport.
export default function HowItWorks() {
  const section = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const [progress, setProgress] = useState(0);
  const [head, setHead] = useState({ x: 0, y: H * 0.66 });
  const d = useMemo(trace, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(Math.min(Math.max((vh * 0.8 - r.top) / (r.height * 0.75), 0), 1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const p = path.current;
    if (!p) return;
    const pt = p.getPointAtLength(p.getTotalLength() * progress);
    setHead({ x: pt.x, y: pt.y });
  }, [progress]);

  const reached = (i: number) => progress >= (i + 0.5) / 3;

  return (
    <section id="how" ref={section} className="sheet relative z-10 -mt-12 bg-plum px-5 py-24 text-glow sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal as="p" className="eyebrow text-peach">How it works</Reveal>
          <Reveal as="h2" delay={140} className="display mt-4 text-[clamp(40px,5.6vw,72px)] leading-[1.02] [text-wrap:balance]">
            Three beats to <em className="text-gradient-warm">a better day</em>
          </Reveal>
        </div>

        {/* Desktop: steps sit on the peaks of a drawn ECG line. */}
        <div className="relative mt-20 hidden md:block">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="how-line" x1="0" x2={W} y1="0" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#86d9c2" />
                <stop offset="0.5" stopColor="#ffb48f" />
                <stop offset="1" stopColor="#f47b63" />
              </linearGradient>
            </defs>
            <path d={d} fill="none" stroke="rgba(255,247,241,0.09)" strokeWidth="2" />
            <path
              ref={path}
              d={d}
              fill="none"
              stroke="url(#how-line)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
              className="drop-shadow-[0_0_10px_rgba(255,180,143,0.65)]"
            />
            {progress > 0.01 && progress < 0.995 && (
              <circle cx={head.x} cy={head.y} r="6" fill="#f47b63" className="drop-shadow-[0_0_12px_rgba(244,123,99,0.9)]" />
            )}
          </svg>
          <ol className="mt-8 grid grid-cols-3 gap-10">
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className={`text-center transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${reached(i) ? "opacity-100" : "translate-y-2 opacity-40"}`}>
                <span className="font-serif text-lg italic text-peach">Step {i + 1}</span>
                <h3 className="mt-2 font-serif text-[28px] leading-tight">{title}</h3>
                <p className="mx-auto mt-3 max-w-xs leading-relaxed text-mist">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Mobile: a vertical trace fills as you scroll. */}
        <ol className="relative mt-14 space-y-12 pl-10 md:hidden">
          <span className="absolute bottom-2 left-[7px] top-2 w-px bg-white/10" aria-hidden="true" />
          <span
            className="absolute left-[7px] top-2 w-0.5 origin-top rounded-full bg-gradient-to-b from-peach to-coral shadow-[0_0_10px_rgba(255,180,143,0.8)]"
            style={{ height: "calc(100% - 1rem)", transform: `scaleY(${progress})` }}
            aria-hidden="true"
          />
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="relative">
              <span
                className={`absolute -left-10 top-1 h-[15px] w-[15px] rounded-full border-2 transition-colors duration-1000 ${reached(i) ? "border-peach bg-peach shadow-[0_0_12px_rgba(255,180,143,0.8)]" : "border-white/20 bg-plum"}`}
                aria-hidden="true"
              />
              <span className="font-serif text-lg italic text-peach">Step {i + 1}</span>
              <h3 className="mt-1 font-serif text-[26px] leading-tight">{title}</h3>
              <p className="mt-2 leading-relaxed text-mist">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
