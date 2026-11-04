"use client";

import { useEffect, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import PulseLine from "./PulseLine";
import Tilt from "./Tilt";

const POSTER = "/video/hero-athlete.jpg";
const VIDEO = "/video/hero-athlete.mp4";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

// White page, a big quiet headline, and the runner in an arch that opens like
// a window. A heartbeat line draws itself under both and a lime dot keeps
// running along it. The footage drifts slower than the page while scrolling,
// and the arch tips a couple of degrees toward the pointer.
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

  // Parallax inside the arch, only while the hero is on screen.
  useEffect(() => {
    if (!motion) return;
    const el = media.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      el.style.transform = `translate3d(0, ${(y * 0.1).toFixed(1)}px, 0) scale(1.14)`;
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
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-4 sm:px-8 lg:grid-cols-[1.45fr_1fr] lg:items-end lg:gap-8">
        <div className="lg:pb-6">
          <h1 className="text-[clamp(46px,7.4vw,112px)] font-medium leading-[0.95] tracking-[-0.05em]">
            {h.title.map((line, i) => (
              <span key={line} className="vl-line">
                <span style={d(150 + i * 140)}>{line}</span>
              </span>
            ))}
          </h1>
          <p className="vl-fade-up mt-8 max-w-md text-xl leading-snug text-fg-muted" style={d(600)}>
            {h.lead}
          </p>
          <div className="vl-fade-up mt-9 flex flex-wrap items-center gap-x-7 gap-y-4" style={d(720)}>
            <a href="#plan" className={buttonClasses({ size: "lg" })}>
              {h.cta}
            </a>
            <a href="#features" className="text-[15px] font-medium underline decoration-line-strong underline-offset-[6px] transition-colors hover:decoration-fg">
              {c.nav.features}
            </a>
          </div>
        </div>

        <Tilt max={3} className="ml-auto w-full max-w-[420px] lg:max-w-none">
          <div className="vl-arch relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-subtle">
            <div ref={media} className="absolute inset-0 will-change-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={POSTER} alt={h.photo} className="absolute inset-0 h-full w-full -scale-x-100 object-cover object-[5%_center]" />
              {motion && (
                <video
                  className={cx("vl-video absolute inset-0 h-full w-full -scale-x-100 object-cover object-[5%_center]", playing && "is-playing")}
                  poster={POSTER}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-hidden="true"
                  onPlaying={() => setPlaying(true)}
                >
                  <source src={VIDEO} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </Tilt>
      </div>

      <div className="vl-pulse-run mt-12 sm:mt-16">
        <PulseLine id="vp-hero-line" />
      </div>
    </section>
  );
}
