"use client";

import { buttonClasses } from "@/components/ui";
import { useCopy } from "./copy";
import PulseLine from "./PulseLine";
import Reveal from "./Reveal";

// The last word, then the heartbeat line draws itself one more time and comes to rest on a lime dot.
export default function Closing() {
  const { c } = useCopy();

  return (
    <section className="overflow-hidden px-4 pb-10 pt-28 text-center sm:px-8 sm:pb-14 sm:pt-40">
      <Reveal as="h2" className="text-[clamp(52px,11vw,156px)] font-medium leading-[0.95] tracking-[-0.055em]">
        {c.closing.title}
      </Reveal>
      <Reveal delay={120} className="mt-10">
        <a href="#plan" className={buttonClasses({ size: "lg" })}>
          {c.closing.cta}
        </a>
      </Reveal>
      <Reveal delay={200} className="-mx-4 mt-24 sm:-mx-8 sm:mt-32">
        <PulseLine id="vp-end-line" travel={false} />
      </Reveal>
    </section>
  );
}
