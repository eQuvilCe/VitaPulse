import { Droplets, Footprints, Moon, Repeat, Salad, Sparkles, type LucideIcon } from "lucide-react";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const FEATURES: { title: string; text: string; Icon: LucideIcon; tint: string }[] = [
  {
    title: "Sleep",
    text: "Log bedtime and wake-up, see your real average and how consistent your rhythm is.",
    Icon: Moon,
    tint: "from-violet-400/20 text-violet-300",
  },
  {
    title: "Water",
    text: "Tap to add a glass. A daily goal that adapts to your weight and activity.",
    Icon: Droplets,
    tint: "from-sky-400/20 text-sky-300",
  },
  {
    title: "Steps",
    text: "Daily steps and trends over weeks, so a lazy Tuesday never hides a great month.",
    Icon: Footprints,
    tint: "from-emerald-400/20 text-emerald-300",
  },
  {
    title: "Nutrition",
    text: "Meals with calories, protein, fat and carbs — and daily totals at a glance.",
    Icon: Salad,
    tint: "from-lime-400/20 text-lime-300",
  },
  {
    title: "Habits",
    text: "Small daily check-ins with streaks that make good routines stick.",
    Icon: Repeat,
    tint: "from-amber-400/20 text-amber-300",
  },
  {
    title: "AI coach",
    text: "Personal tips based on your own data, not generic advice from the internet.",
    Icon: Sparkles,
    tint: "from-rose-400/20 text-rose-300",
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SplitHeading text="Everything that keeps you going" className="text-3xl font-semibold tracking-tight sm:text-5xl" />
          <Reveal as="p" delay={150} className="mt-4 text-lg text-slate-400">
            Six signals your body sends every day, finally in one place.
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, text, Icon, tint }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="group h-full rounded-3xl border border-white/5 bg-card/60 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-card">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br to-transparent ${tint} transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-6`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-400">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
