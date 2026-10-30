import { Drop, Plate, Pulse, Ripple, SleepWave, Streak } from "./Vignettes";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const FEATURES = [
  { title: "Sleep", text: "Bedtime, wake-up and how steady your rhythm really is.", Art: SleepWave },
  { title: "Water", text: "One tap per glass, with a goal that follows your day.", Art: Drop },
  { title: "Steps", text: "Daily movement and the trend behind it, week over week.", Art: Pulse },
  { title: "Nutrition", text: "Meals with calories, protein, fat and carbs, totalled for you.", Art: Plate },
  { title: "Habits", text: "Small daily check-ins and streaks that make routines stick.", Art: Streak },
  { title: "AI coach", text: "One clear suggestion a day, drawn from your own data.", Art: Ripple },
];

export default function Features() {
  return (
    <section id="features" className="bg-ink px-5 py-24 text-paper sm:py-32">
      <SplitHeading
        text="Six signals, one rhythm"
        className="mx-auto max-w-5xl text-center font-serif text-[clamp(48px,9vw,94px)] font-normal leading-[0.84] tracking-[-0.009em]"
      />
      <Reveal as="p" delay={150} className="mx-auto mt-8 max-w-lg text-center text-[15px] text-paper/60">
        Everything your body tells you each day, kept in one quiet place.
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-x-4 gap-y-12 sm:mt-20 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-3">
        {FEATURES.map(({ title, text, Art }, i) => (
          <Reveal key={title} delay={(i % 3) * 110} className="flex flex-col items-center text-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-bone p-9 text-ink sm:h-[200px] sm:w-[200px] sm:p-12">
              <Art />
            </div>
            <h3 className="mt-5 font-serif sm:mt-7 text-[22px] font-normal">{title}</h3>
            <p className="mt-2 max-w-[16rem] text-[13px] leading-relaxed text-paper/60 sm:text-sm">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
