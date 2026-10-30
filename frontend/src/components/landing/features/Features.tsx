import { Droplets, Footprints, Moon, Repeat, Salad, Sparkles, type LucideIcon } from "lucide-react";
import Reveal from "../Reveal";
import { CoachArt, HabitsArt, NutritionArt, SleepArt, StepsArt, WaterArt } from "./FeatureArt";

type Feature = {
  title: string;
  stat: string;
  text: string;
  Icon: LucideIcon;
  Art: () => JSX.Element;
  tone: string;
  wide?: boolean;
};

const FEATURES: Feature[] = [
  { title: "Sleep", stat: "7h 42m", text: "Bedtime, wake-up and how steady your rhythm really is.", Icon: Moon, Art: SleepArt, tone: "text-[#5fb9a2] bg-mint/20", wide: true },
  { title: "Water", stat: "1.8 of 2.5 L", text: "One tap per glass, with a goal that follows your day.", Icon: Droplets, Art: WaterArt, tone: "text-[#5fb9a2] bg-mint/20" },
  { title: "Steps", stat: "8,214 today", text: "Daily movement and the gentle trend behind it.", Icon: Footprints, Art: StepsArt, tone: "text-coral bg-coral/15" },
  { title: "Nutrition", stat: "1,940 kcal", text: "Meals with protein, carbs and fat, totalled as you go.", Icon: Salad, Art: NutritionArt, tone: "text-[#e58b5f] bg-peach/25" },
  { title: "Habits", stat: "5-day streak", text: "Small daily check-ins and streaks that make routines stick.", Icon: Repeat, Art: HabitsArt, tone: "text-coral bg-coral/15", wide: true },
  { title: "AI coach", stat: "One tip a day", text: "A kind, concrete suggestion drawn from your own data.", Icon: Sparkles, Art: CoachArt, tone: "text-[#e58b5f] bg-peach/25", wide: true },
];

export default function Features() {
  return (
    <section id="features" className="sheet relative z-10 -mt-12 bg-cream px-5 py-24 text-ink sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal as="p" className="eyebrow text-coral">Everything in one place</Reveal>
          <Reveal as="h2" delay={80} className="display mt-4 text-[clamp(40px,5.6vw,72px)] leading-[1.02] [text-wrap:balance]">
            Six signals, <em>one gentle pulse</em>
          </Reveal>
          <Reveal as="p" delay={160} className="mt-5 text-lg leading-relaxed text-ink-soft">
            Everything your body tells you each day, read together instead of in six separate apps.
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, stat, text, Icon, Art, tone, wide }, i) => (
            <Reveal key={title} delay={(i % 3) * 110}>
              <article className="lift-card group flex h-full flex-col rounded-[28px] border border-ink/[0.06] bg-white/75 p-7 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-cream-2 px-3 py-1 text-xs font-semibold text-ink-soft tabular-nums">{stat}</span>
                </div>
                <div className={`mt-8 flex h-24 items-center ${tone.split(" ")[0]} transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]`}>
                  <div className={`h-24 ${wide ? "w-full max-w-[240px]" : "w-24"}`}>
                    <Art />
                  </div>
                </div>
                <h3 className="mt-8 font-serif text-[26px] leading-tight">{title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
