"use client";

import { useEffect, useState } from "react";
import { PULSE_PATH } from "./pulse";

const SHOW_MS = 2000;
const FADE_MS = 500;

// The intro plays on full page loads; client-side navigation back home skips it.
let played = false;

// Full-screen pulse intro shown on every load. It is server-rendered so the
// landing never flashes underneath it; a CSS fallback in globals.css fades it
// out even if JavaScript never runs, and reduced-motion users never see it.
export default function IntroLoader() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">(() => (played ? "gone" : "show"));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played || reduced) {
      // Hero entrance waits for the intro by default; start it right away instead.
      document.documentElement.classList.add("no-intro");
      setPhase("gone");
      return;
    }
    const fade = window.setTimeout(() => setPhase("fade"), SHOW_MS);
    const gone = window.setTimeout(() => {
      // Marked only once the intro has really finished: StrictMode re-runs effects.
      played = true;
      setPhase("gone");
    }, SHOW_MS + FADE_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`intro ${phase === "fade" ? "intro-fade" : ""}`} aria-hidden="true">
      <div className="intro-glow" />
      <svg className="intro-heart" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.7 1.1 5.3 3 1.6-1.9 3.2-3 5.3-3 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z" />
      </svg>
      <svg className="intro-line" viewBox="0 0 600 120" fill="none" preserveAspectRatio="xMidYMid meet">
        <path d={PULSE_PATH} pathLength={1} className="intro-line-shadow" />
        <path d={PULSE_PATH} pathLength={1} className="intro-line-path" />
      </svg>
      <p className="intro-word">
        Vita<span>Pulse</span>
      </p>
    </div>
  );
}
