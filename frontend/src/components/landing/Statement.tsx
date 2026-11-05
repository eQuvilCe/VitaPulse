"use client";

import { cx } from "@/lib/cx";
import { fill, useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import Reveal from "./Reveal";

const WORD_STEP = 90;

// A made-up 10-week weigh-in, drawn as the progress row's chart.
const WEIGHTS = [82.4, 81.9, 81.5, 81.6, 80.7, 80.2, 79.6, 79.3, 78.4, 77.6];
const CHART = (() => {
  const lo = Math.min(...WEIGHTS) - 0.5;
  const hi = Math.max(...WEIGHTS) + 0.5;
  const pts = WEIGHTS.map((v, i) => [(i / (WEIGHTS.length - 1)) * 200, 6 + ((hi - v) / (hi - lo)) * 58] as const);
  return { pts, d: pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") };
})();

function Words({ text, start }: { text: string; start: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="vl-word" style={{ "--d": `${start + i * WORD_STEP}ms` } as React.CSSProperties}>
            {w}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

// Small live pictures at the end of each row: a calorie ring that fills, a
// scan frame gliding over a plate, a weight line that draws itself point by point.
function Visual({ index }: { index: number }) {
  const { c, locale } = useCopy();
  const m = c.statement.mock;
  const n = (v: number) => v.toLocaleString(locale);

  if (index === 0)
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="h-[72px] w-[72px] shrink-0 -rotate-90 text-accent-2" aria-hidden="true">
          <circle cx="32" cy="32" r="27" fill="none" stroke="rgb(var(--vh-line))" strokeWidth="4" />
          <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" pathLength={1} className="vl-ring" />
        </svg>
        <div>
          <p className="text-[28px] font-medium leading-none tracking-[-0.04em] tabular-nums">{n(1340)}</p>
          <p className="mt-1.5 text-caption text-fg-subtle">
            {m.eaten} · {fill(m.of, { kcal: n(1850) })}
          </p>
        </div>
      </div>
    );

  if (index === 1)
    return (
      <div className="relative h-24 overflow-hidden rounded-[20px] [container-type:inline-size]">
        <Photo id={PHOTOS.plate} alt="" width={420} height={224} sizes="(min-width: 768px) 24vw, 90vw" className="h-full w-full" />
        <span
          className="vl-scan absolute bottom-2 left-2 top-2 w-16 rounded-[14px] border-2 border-cream"
          style={{ "--travel": "calc(100cqw - 4rem - 1rem)" } as React.CSSProperties}
          aria-hidden="true"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-accent px-3 py-1 text-caption text-accent-on">{fill(m.dish, { kcal: n(390) })}</span>
      </div>
    );

  return (
    <div className="flex items-end gap-4 text-accent-2">
      <svg viewBox="-4 0 208 70" className="h-16 min-w-0 flex-1 overflow-visible" aria-hidden="true">
        <path d={CHART.d} pathLength={1} className="vl-chart-line" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {CHART.pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" className="vl-chart-dot fill-canvas stroke-current" strokeWidth="2" style={{ "--d": `${500 + i * 90}ms` } as React.CSSProperties} />
        ))}
      </svg>
      <p className="whitespace-nowrap text-[22px] font-medium leading-none tracking-[-0.03em] text-fg">{m.lost}</p>
    </div>
  );
}

// One big centred statement whose words appear one by one around a small
// photo that opens up in the line, a narrow paragraph, then the features as
// three plain rows: title, a sentence, and a live picture.
export default function Statement() {
  const { c } = useCopy();
  const s = c.statement;
  const beforeCount = s.before.split(" ").length;
  const photoDelay = beforeCount * WORD_STEP;

  return (
    <section id="features" className="px-4 py-24 sm:px-8 sm:py-36">
      <Reveal as="h2" className="mx-auto max-w-5xl text-center text-[clamp(38px,6.4vw,92px)] font-medium leading-[1.04] tracking-[-0.045em]">
        <Words text={s.before} start={0} />
        <span
          className="vl-inline-photo h-[0.7em] -translate-y-[0.06em] overflow-hidden rounded-full align-middle"
          style={{ "--d": `${photoDelay}ms` } as React.CSSProperties}
        >
          <Photo id={PHOTOS.bowl} alt={s.photo} width={240} height={130} sizes="(min-width: 640px) 220px, 110px" className="h-full w-[1.7em] max-w-none" />
        </span>{" "}
        <Words text={s.after} start={photoDelay + 200} />
      </Reveal>
      <Reveal as="p" delay={150} className="mx-auto mt-8 max-w-md text-center text-lg leading-snug text-fg-muted">
        {s.text}
      </Reveal>

      <div className="mx-auto mt-20 max-w-6xl border-b border-line-strong sm:mt-28">
        {s.features.map((f, i) => (
          <Reveal
            key={f.tag}
            delay={i * 90}
            className={cx("vl-row group grid items-center gap-6 py-10 md:grid-cols-[0.95fr_1.1fr_0.85fr] md:gap-12 md:py-14")}
          >
            <h3 className="text-[clamp(28px,3.2vw,42px)] font-medium leading-[1.05] tracking-[-0.035em] transition-colors duration-300 group-hover:text-accent">{f.title}</h3>
            <p className="max-w-md text-lg leading-snug text-fg-muted">{f.text}</p>
            <div className="w-full max-w-[260px] md:justify-self-end">
              <Visual index={i} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
