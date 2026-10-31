"use client";

import { useCopy } from "./copy";
import { unsplash, PHOTOS } from "./Photo";

// Full-bleed daylight photo, a huge cream headline bottom-left, one line of
// explanation and a ghost button. A soft curve hands over to the cream page.
export default function Hero() {
  const { c } = useCopy();
  const h = c.hero;
  const src = (w: number) => unsplash(PHOTOS.hero, w);

  return (
    <section id="top" className="relative isolate flex min-h-[640px] items-end overflow-hidden text-canvas h-[100svh] max-h-[1000px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src(1600)}
        srcSet={`${src(800)} 800w, ${src(1600)} 1600w, ${src(2400)} 2400w`}
        sizes="100vw"
        alt={h.photo}
        loading="eager"
        className="absolute inset-0 -z-20 h-full w-full bg-kcal-300 object-cover object-[70%_center]"
      />
      {/* A flat tint keeps the cream type readable without a gradient. */}
      <div className="absolute inset-0 -z-10 bg-fg/25" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 sm:px-8 sm:pb-32">
        <h1 className="font-display text-[clamp(56px,12.5vw,150px)] uppercase leading-[0.85]">
          {h.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <p className="max-w-sm text-lg leading-snug sm:text-xl">{h.lead}</p>
          <a
            href="#plan"
            className="inline-flex h-14 w-fit items-center rounded-card border border-canvas px-7 text-base font-medium transition-colors hover:bg-canvas hover:text-fg"
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
