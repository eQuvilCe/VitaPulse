"use client";

import { buttonClasses } from "@/components/ui";
import { useCopy } from "./copy";
import Reveal from "./Reveal";

export default function Closing() {
  const { c } = useCopy();

  return (
    <section className="border-t border-line px-4 py-20 text-center sm:px-8 sm:py-28">
      <Reveal as="h2" className="font-display text-[clamp(56px,13vw,150px)] uppercase leading-[0.85]">
        {c.closing.title}
      </Reveal>
      <Reveal delay={80} className="mt-10">
        <a href="#plan" className={buttonClasses({ size: "lg" })}>
          {c.closing.cta}
        </a>
      </Reveal>
    </section>
  );
}
