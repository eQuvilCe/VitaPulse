"use client";

import { Card } from "@/components/ui";
import { cx } from "@/lib/cx";
import { fill, useCopy } from "./copy";
import Photo, { PHOTOS } from "./Photo";
import Reveal from "./Reveal";

// The calorie scan is the one violet block.
const ACCENT = 1;
const WORD_STEP = 90;

// A made-up 10-week weigh-in, drawn as the progress card's chart.
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

// Mini animations inside the feature cards: a calorie ring that fills, a scan
// frame gliding over a plate, a weight line that draws itself point by point.
function Visual({ index }: { index: number }) {
  const { c, locale } = useCopy();
  const m = c.statement.mock;
  const n = (v: number) => v.toLocaleString(locale);

  if (index === 0)
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="6" />
          <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" pathLength={1} className="vl-ring" />
        </svg>
        <div>
          <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{n(1340)}</p>
          <p className="mt-1 text-caption opacity-70">
            {m.eaten} · {fill(m.of, { kcal: n(1850) })}
          </p>
        </div>
      </div>
    );

  if (index === 1)
    return (
      <div className="relative h-28 overflow-hidden rounded-card [container-type:inline-size]">
        <Photo id={PHOTOS.plate} alt="" width={420} height={224} sizes="(min-width: 768px) 30vw, 90vw" className="h-full w-full" />
        <span
          className="vl-scan absolute bottom-2 left-2 top-2 w-20 rounded-[14px] border-2 border-accent-on"
          style={{ "--travel": "calc(100cqw - 5rem - 1rem)" } as React.CSSProperties}
          aria-hidden="true"
        />
        <span className="absolute bottom-2 right-2 rounded-card bg-accent px-3 py-1 text-caption text-accent-on">
          {fill(m.dish, { kcal: n(390) })}
        </span>
      </div>
    );

  return (
    <div className="flex items-end gap-4">
      <svg viewBox="-4 0 208 70" className="h-20 flex-1 overflow-visible" aria-hidden="true">
        <path d={CHART.d} pathLength={1} className="vl-chart-line" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {CHART.pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" className="vl-chart-dot fill-canvas stroke-current" strokeWidth="2" style={{ "--d": `${500 + i * 90}ms` } as React.CSSProperties} />
        ))}
      </svg>
      <p className="whitespace-nowrap text-[22px] font-semibold leading-none tracking-[-0.03em]">{m.lost}</p>
    </div>
  );
}

// One huge centred statement whose words appear one by one around a small
// photo that opens up in the line, a narrow paragraph, then the features.
export default function Statement() {
  const { c } = useCopy();
  const s = c.statement;
  const beforeCount = s.before.split(" ").length;
  const photoDelay = beforeCount * WORD_STEP;

  return (
    <section id="features" className="px-4 py-20 sm:px-8 sm:py-32">
      <Reveal as="h2" className="mx-auto max-w-6xl text-center font-display text-[clamp(44px,9.5vw,120px)] uppercase leading-[0.92]">
        <Words text={s.before} start={0} />
        <span
          className="vl-inline-photo h-[0.72em] -translate-y-[0.06em] overflow-hidden rounded-card align-middle"
          style={{ "--d": `${photoDelay}ms` } as React.CSSProperties}
        >
          <Photo id={PHOTOS.bowl} alt={s.photo} width={240} height={130} sizes="(min-width: 640px) 220px, 110px" className="h-full w-[1.5em] max-w-none" />
        </span>{" "}
        <Words text={s.after} start={photoDelay + 200} />
      </Reveal>
      <Reveal as="p" delay={150} className="mx-auto mt-8 max-w-md text-center text-lg leading-snug text-fg-muted">
        {s.text}
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-6xl gap-4 sm:mt-20 md:grid-cols-3">
        {s.features.map((f, i) => {
          const accent = i === ACCENT;
          return (
            <Reveal key={f.tag} delay={i * 140}>
              <Card tone={accent ? "accent" : "surface"} className="vl-card flex h-full flex-col">
                <span className="text-caption font-medium opacity-70">{f.tag}</span>
                <div className="mt-6">
                  <Visual index={i} />
                </div>
                <h3 className="mt-8 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{f.title}</h3>
                <p className={cx("mt-2 text-body", accent ? "text-accent-on/85" : "text-fg-muted")}>{f.text}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
