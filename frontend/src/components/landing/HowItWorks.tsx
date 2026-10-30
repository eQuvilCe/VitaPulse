import { BellRing, LineChart, UserPlus, type LucideIcon } from "lucide-react";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const STEPS: { title: string; text: string; Icon: LucideIcon }[] = [
  {
    title: "Create your account",
    text: "Sign up in under a minute and set a few goals — sleep, water, steps.",
    Icon: UserPlus,
  },
  {
    title: "Log your day",
    text: "Add sleep, glasses of water, meals and habit check-ins in a couple of taps.",
    Icon: LineChart,
  },
  {
    title: "Get coached",
    text: "Your dashboard and AI coach turn the numbers into one clear next step.",
    Icon: BellRing,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SplitHeading text="How it works" className="text-3xl font-semibold tracking-tight sm:text-5xl" />
          <Reveal as="p" delay={150} className="mt-4 text-lg text-slate-400">
            Three steps from scattered notes to a daily rhythm.
          </Reveal>
        </div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <div
            className="steps-line absolute left-[16.6%] right-[16.6%] top-7 hidden h-px md:block"
            aria-hidden="true"
          />
          {STEPS.map(({ title, text, Icon }, i) => (
            <Reveal key={title} delay={i * 140} className="relative text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-bg text-accent shadow-[0_0_0_8px_#0b0f14]">
                <Icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-400">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
