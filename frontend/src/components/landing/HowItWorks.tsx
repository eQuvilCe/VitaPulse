import Hex from "./Hex";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const STEPS = [
  { title: "Create an account", text: "Sign up in under a minute and set a few goals for sleep, water and steps." },
  { title: "Log your day", text: "Sleep, glasses of water, meals and habit check-ins, each in a couple of taps." },
  { title: "Follow your coach", text: "Your dashboard and AI coach turn the numbers into one next step." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-putty px-5 py-24 text-ink sm:py-32">
      <SplitHeading
        text="How it works"
        className="text-center font-serif text-[clamp(48px,9vw,94px)] font-normal leading-[0.84] tracking-[-0.009em]"
      />

      <div className="mx-auto mt-20 grid max-w-5xl gap-4 md:grid-cols-3">
        {STEPS.map(({ title, text }, i) => (
          <Reveal key={title} delay={i * 120}>
            <div className="flex h-full flex-col rounded-[9px] border border-vellum bg-bone p-7">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-graphite">
                <Hex filled={i === 0} />
                Step {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-14 font-serif text-[30px] font-normal leading-tight">{title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-graphite">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
