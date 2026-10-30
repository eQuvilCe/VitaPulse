import Link from "next/link";
import Hex from "./Hex";

const STATS = [
  ["Sleep", "7.4h"],
  ["Water", "2.1L"],
  ["Steps", "9 812"],
];

// The giant wordmark is the intro's landing spot: it grows out of the ECG
// spike and glides down here (animations in globals.css).
export default function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-putty text-ink">
      <div className="hero-cluster relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 pt-[26svh] text-center sm:pt-[16svh]">
        <h1 className="font-serif text-[clamp(34px,5.2vw,52px)] font-normal leading-[1.02] tracking-[-0.01em]">
          Your whole health,
          <br />
          in one <em className="italic">rhythm</em>.
        </h1>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] font-medium uppercase tracking-wide sm:text-base">
          {STATS.map(([label, value]) => (
            <li key={label} className="flex items-center gap-2">
              <Hex />
              {label}: {value}
            </li>
          ))}
        </ul>
        <Link
          href="/register"
          className="mt-7 rounded-[28.8px] bg-ink px-[17px] py-[9px] text-xs font-medium text-paper transition-opacity hover:opacity-80"
        >
          Start free
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <p className="hero-wordmark select-none whitespace-nowrap font-serif font-medium" aria-hidden="true">
          VitaPulse
        </p>
      </div>
    </section>
  );
}
