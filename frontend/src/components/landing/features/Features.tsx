import Reveal from "../Reveal";
import { CoachArt, HabitsArt, NutritionArt, SleepArt, StepsArt, WaterArt } from "./FeatureArt";

const FEATURES = [
  { title: "Sleep", wide: true, stat: "7h 42m · 91% steady", text: "Bedtime, wake-up and how consistent your rhythm really is.", Art: SleepArt },
  { title: "Water", stat: "1.8 / 2.5 L", text: "One tap per glass, with a goal that follows your weight and day.", Art: WaterArt },
  { title: "Steps", stat: "8 214 · goal 10k", text: "Daily movement and the weekly trend behind it.", Art: StepsArt },
  { title: "Nutrition", stat: "1 940 kcal", text: "Meals with protein, carbs and fat, totalled as you go.", Art: NutritionArt },
  { title: "Habits", wide: true, stat: "5-day streak", text: "Small daily check-ins and streaks that make routines stick.", Art: HabitsArt },
  { title: "AI coach", wide: true, stat: "1 tip a day", text: "One concrete suggestion, drawn from your own data.", Art: CoachArt },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-16 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal as="h2" className="font-display text-[clamp(36px,5.4vw,72px)] font-semibold leading-[0.95] tracking-[-0.03em] text-bone [text-wrap:balance]">
            Six signals. One pulse.
          </Reveal>
          <Reveal as="p" delay={120} className="max-w-md text-lg leading-relaxed text-sage lg:justify-self-end">
            Everything your body tells you each day, read together instead of in six separate apps.
          </Reveal>
        </div>

        <div className="mt-16 grid overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-3 [&>*]:bg-night">
          {FEATURES.map(({ title, stat, text, Art, wide }, i) => (
            <Reveal key={title} delay={(i % 3) * 90} className="flex flex-col p-7 sm:p-9">
              <div className="flex h-24 items-center text-mint">
                <div className={`h-24 ${wide ? "w-full max-w-[240px]" : "w-24"}`}>
                  <Art />
                </div>
              </div>
              <div className="mt-10 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-bone">{title}</h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-mint/80">{stat}</span>
              </div>
              <p className="mt-3 leading-relaxed text-sage">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
