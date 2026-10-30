import { ECG_PATH } from "./pulse";

// Monochrome line drawings for the feature vignettes (no photos or colour).
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SleepWave() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          {...stroke}
          opacity={1 - i * 0.3}
          d={`M14 ${50 + i * 12} C30 ${30 + i * 12} 44 ${30 + i * 12} 60 ${50 + i * 12} S90 ${70 + i * 12} 106 ${50 + i * 12}`}
        />
      ))}
    </svg>
  );
}

export function Drop() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <path {...stroke} d="M60 22 C60 22 34 54 34 72 a26 26 0 0 0 52 0 C86 54 60 22 60 22 Z" />
      <path {...stroke} opacity={0.5} d="M47 74 a13 13 0 0 0 13 13" />
    </svg>
  );
}

export function Pulse() {
  return (
    <svg viewBox="420 0 560 360" className="h-full w-full">
      <path {...stroke} strokeWidth={9} d={ECG_PATH} />
    </svg>
  );
}

export function Plate() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <circle {...stroke} cx="60" cy="60" r="34" opacity={0.35} />
      <path {...stroke} strokeWidth={5} d="M60 26 A34 34 0 0 1 93 68" />
      <path {...stroke} strokeWidth={5} opacity={0.7} d="M90 76 A34 34 0 0 1 36 84" />
      <path {...stroke} strokeWidth={5} opacity={0.45} d="M31 78 A34 34 0 0 1 54 27" />
    </svg>
  );
}

export function Streak() {
  const hex = (cx: number, cy: number) =>
    [0, 1, 2, 3, 4, 5]
      .map((k) => {
        const a = (Math.PI / 3) * k - Math.PI / 2;
        return `${(cx + 9 * Math.cos(a)).toFixed(1)},${(cy + 9 * Math.sin(a)).toFixed(1)}`;
      })
      .join(" ");
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const cx = 18 + (i % 4) * 28 + (i >= 4 ? 14 : 0);
        const cy = i >= 4 ? 74 : 48;
        return <polygon key={i} {...stroke} strokeWidth={1.75} points={hex(cx, cy)} fill={i < 5 ? "currentColor" : "none"} />;
      })}
    </svg>
  );
}

export function Ripple() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      {[10, 22, 34, 46].map((r, i) => (
        <circle key={r} {...stroke} cx="60" cy="60" r={r} opacity={1 - i * 0.22} />
      ))}
    </svg>
  );
}
