import Link from "next/link";
import Reveal from "./Reveal";

// Rings expand from the centre once per heartbeat, echoing the intro ripple.
export default function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden px-5 py-32 text-center sm:px-8 sm:py-44">
      <div className="absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="cta-ring absolute h-[44rem] w-[44rem] rounded-full border border-mint/40 shadow-[0_0_30px_rgba(111,242,194,0.15)]" style={{ animationDelay: `${i}s` }} />
        ))}
        <span className="h-64 w-64 rounded-full bg-mint/10 blur-3xl" />
      </div>
      <Reveal as="h2" className="mx-auto max-w-4xl font-display text-[clamp(40px,7vw,96px)] font-semibold leading-[0.92] tracking-[-0.035em] text-bone [text-wrap:balance]">
        Start listening to your body.
      </Reveal>
      <Reveal as="p" delay={120} className="mx-auto mt-6 max-w-md text-lg text-sage">
        One minute to sign up. Free while in early access.
      </Reveal>
      <Reveal delay={220} className="mt-10">
        <Link
          href="/register"
          className="inline-block rounded-full bg-mint px-8 py-4 font-semibold text-night shadow-[0_0_50px_-6px_rgba(111,242,194,0.65)] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
        >
          Start free
        </Link>
      </Reveal>
    </section>
  );
}
