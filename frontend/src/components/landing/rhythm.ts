// Shared heartbeat model for the intro and the flat pulse drawings.

const wave = (x: number, mu: number, sigma: number, amp: number) =>
  amp * Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));

// One ECG cycle as a sum of gaussians (P, Q, R, S, T). `phase` is 0..1,
// the R peak sits at phase 0.4 with height 1.
export const R_PHASE = 0.4;

export function ecg(phase: number) {
  return (
    wave(phase, 0.18, 0.025, 0.12) +
    wave(phase, 0.38, 0.007, -0.12) +
    wave(phase, R_PHASE, 0.008, 1) +
    wave(phase, 0.425, 0.009, -0.24) +
    wave(phase, 0.64, 0.04, 0.24)
  );
}

// SVG path of a few beats, for flat (non-WebGL) drawings.
export function ecgPath(width: number, height: number, beats = 3, samples = 360) {
  const mid = height * 0.62;
  const amp = height * 0.55;
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const y = mid - ecg((s * beats) % 1) * amp;
    d += `${i ? "L" : "M"}${(s * width).toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

// Gentlest S-curve: peak speed only ~1.57x the average, so no lurches.
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
