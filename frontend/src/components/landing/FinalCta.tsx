import Link from "next/link";
import Reveal from "./Reveal";

// Warm rings breathe out from the centre once per heartbeat, echoing the intro.
export default function FinalCta() {
  return (
    <section className="sheet relative isolate z-10 -mt-12 overflow-hidden bg-plum px-5 py-32 text-center text-glow sm:px-8 sm:py-44">
      <div className="absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="cta-ring absolute h-[42rem] w-[42rem] rounded-full border border-peach/40" style={{ animationDelay: `${i}s` }} />
        ))}
        <span className="h-80 w-80 rounded-full bg-coral/25 blur-[90px]" />
      </div>
      <Reveal as="h2" className="display mx-auto max-w-4xl text-[clamp(44px,7vw,96px)] leading-[1] [text-wrap:balance]">
        Start listening to <em className="text-gradient-warm">your body</em>
      </Reveal>
      <Reveal as="p" delay={120} className="mx-auto mt-6 max-w-md text-lg text-mist">
        One minute to sign up. Free while we are in early access.
      </Reveal>
      <Reveal delay={220} className="mt-10">
        <Link href="/register" className="btn-warm inline-block rounded-full px-9 py-4 text-base font-semibold">
          Start free
        </Link>
      </Reveal>
    </section>
  );
}
