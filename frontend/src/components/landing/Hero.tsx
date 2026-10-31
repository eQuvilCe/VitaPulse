"use client";

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";
import { useCopy } from "./copy";

const POSTER = "/video/hero-athlete.jpg";
const VIDEO = "/video/hero-athlete.mp4";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

// Full-bleed video of an athlete running across a sunny stadium (Pexels, free
// licence), mirrored so the runner sits to the right of the headline.
// The poster paints first; the video fades in once it actually plays, and
// reduced-motion visitors keep the still poster. The footage drifts slower
// than the page while scrolling, and the headline lines rise one by one.
export default function Hero() {
  const { c } = useCopy();
  const h = c.hero;
  const media = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotion(!reduce.matches);
    const onChange = () => setMotion(!reduce.matches);
    reduce.addEventListener("change", onChange);
    return () => reduce.removeEventListener("change", onChange);
  }, []);

  // Gentle parallax, only while the hero is on screen.
  useEffect(() => {
    if (!motion) return;
    const el = media.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      el.style.transform = `translate3d(0, ${(y * 0.25).toFixed(1)}px, 0) scale(1.06)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, [motion]);

  return (
    <section id="top" className="relative isolate flex h-[100svh] max-h-[1000px] min-h-[600px] items-end overflow-hidden text-cream">
      <div ref={media} className="absolute inset-0 -z-20 will-change-transform" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={POSTER} alt="" className="absolute inset-0 h-full w-full -scale-x-100 bg-kcal-300 object-cover object-[22%_center]" />
        {motion && (
          <video
            className={cx("vl-video absolute inset-0 h-full w-full -scale-x-100 object-cover object-[22%_center]", playing && "is-playing")}
            poster={POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onPlaying={() => setPlaying(true)}
          >
            <source src={VIDEO} type="video/mp4" />
          </video>
        )}
      </div>
      {/* A light scrim at the bottom keeps the cream headline readable. */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink/55 via-ink/20 to-transparent" aria-hidden="true" />
      <p className="sr-only">{h.photo}</p>

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 sm:px-8 sm:pb-32">
        <h1 className="font-display text-[clamp(56px,12.5vw,150px)] uppercase leading-[0.85]">
          {h.title.map((line, i) => (
            <span key={line} className="vl-line">
              <span style={d(150 + i * 140)}>{line}</span>
            </span>
          ))}
        </h1>
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <p className="vl-fade-up max-w-sm text-lg leading-snug sm:text-xl" style={d(550)}>
            {h.lead}
          </p>
          <a
            href="#plan"
            className="vl-fade-up inline-flex h-14 w-fit items-center rounded-card border border-cream px-7 text-base font-medium transition-colors duration-300 hover:bg-cream hover:text-ink"
            style={d(680)}
          >
            {h.cta}
          </a>
        </div>
      </div>

      {/* The gentle curve into the cream page. */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[-1px] h-10 w-full text-canvas sm:h-16" aria-hidden="true">
        <path d="M0 80V48C240 16 480 0 720 0s480 16 720 48v32z" fill="currentColor" />
      </svg>
    </section>
  );
}
