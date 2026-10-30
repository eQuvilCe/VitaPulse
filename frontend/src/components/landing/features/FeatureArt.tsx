// Small looping illustrations for the feature grid. Pure SVG + CSS (globals.css,
// "Feature art"), paced in multiples of the 1 s heartbeat.

export function SleepArt() {
  const wave = (amp: number, y: number) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 480; x += 40) d += ` Q${x + 20} ${y - amp} ${x + 40} ${y} T${x + 80} ${y}`;
    return d;
  };
  return (
    <svg viewBox="0 0 240 96" preserveAspectRatio="xMinYMid meet" className="h-full w-full overflow-hidden" aria-hidden="true">
      <g className="art-slide">
        <path d={wave(18, 50)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d={wave(10, 62)} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      </g>
    </svg>
  );
}

export function WaterArt() {
  const drop = "M48 6 C48 6 20 40 20 60 a28 28 0 0 0 56 0 C76 40 48 6 48 6 Z";
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id="art-drop">
          <path d={drop} />
        </clipPath>
      </defs>
      <g clipPath="url(#art-drop)">
        <g className="art-fill">
          <path d="M-40 60 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V120 H-40 Z" fill="currentColor" opacity="0.85" className="art-surface" />
        </g>
      </g>
      <path d={drop} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function StepsArt() {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.15" />
      <circle
        cx="48"
        cy="48"
        r="38"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength={1}
        className="art-ring"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="53" textAnchor="middle" className="fill-ink text-[14px] font-semibold">
        8 214
      </text>
    </svg>
  );
}

export function NutritionArt() {
  const bars = [
    { label: "P", h: 54 },
    { label: "C", h: 70 },
    { label: "F", h: 38 },
  ];
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {bars.map(({ label, h }, i) => (
        <g key={label}>
          <rect
            x={16 + i * 26}
            y={80 - h}
            width="14"
            height={h}
            rx="7"
            fill="currentColor"
            opacity={1 - i * 0.25}
            className="art-bar"
            style={{ animationDelay: `${i * 0.6}s` }}
          />
          <text x={23 + i * 26} y="94" textAnchor="middle" className="fill-ink-soft text-[9px] font-semibold">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HabitsArt() {
  return (
    <svg viewBox="0 0 168 96" preserveAspectRatio="xMinYMid meet" className="h-full w-full" aria-hidden="true">
      {"MTWTFSS".split("").map((d, i) => (
        <g key={i}>
          <circle
            cx={12 + i * 24}
            cy="44"
            r="8"
            fill="currentColor"
            className="art-day"
            style={{ animationDelay: `${i * 0.45}s` }}
          />
          <circle cx={12 + i * 24} cy="44" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <text x={12 + i * 24} y="72" textAnchor="middle" className="fill-ink-soft text-[9px] font-semibold">
            {d}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function CoachArt() {
  return (
    <div className="flex h-full w-full items-center" aria-hidden="true">
      <div className="w-full rounded-[20px] rounded-bl-md bg-gradient-to-br from-peach/30 to-coral/20 px-4 py-3 text-[13px] font-medium leading-relaxed text-ink">
        <span className="art-type inline-block max-w-full overflow-hidden whitespace-nowrap align-bottom">
          Walk 10 min after lunch
        </span>
        <span className="art-caret ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 rounded-full bg-coral" />
      </div>
    </div>
  );
}
