"use client";

import Link from "next/link";

import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import Reveal from "./Reveal";
import { ecgPath } from "./rhythm";

const PULSE = ecgPath(1000, 120, 3);

export default function FinalCta() {
  const { c } = useCopy();

  return (
    <section className="px-4 py-20 sm:px-8 sm:py-24">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-panel bg-brand-800 px-6 py-14 text-center text-white shadow-raised sm:px-12 sm:py-20">
        <Photo id={PHOTOS.vegetables} alt="" width={1200} height={500} sizes="100vw" className="absolute inset-0 h-full w-full opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-800/40 to-brand-800" aria-hidden="true" />
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-4 h-20 w-full text-brand-300/40" aria-hidden="true">
          <path d={PULSE} pathLength={1} className="vl-draw" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative">
          <h2 className="vl-display mx-auto max-w-2xl text-[clamp(32px,5vw,56px)] leading-[1.05] [text-wrap:balance]">{c.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-lead text-white/80">{c.cta.text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
            <a
              href="#plan"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-lead font-semibold text-brand-800 shadow-card transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-brand-50"
            >
              {c.cta.primary}
            </a>
            <Link
              href="/signup"
              className={cx(
                "inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-lead font-semibold text-white transition-colors duration-300 hover:bg-white/10",
              )}
            >
              {c.cta.secondary}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
