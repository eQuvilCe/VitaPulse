"use client";

import { useEffect, useState } from "react";
import { PULSE_PATH } from "./pulse";

const SHOW_MS = 1900;
const FADE_MS = 700;

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
      <div className="intro-blob intro-blob-a" />
      <div className="intro-blob intro-blob-b" />
      <div className="intro-blob intro-blob-c" />
      <div className="intro-glass">
        <svg className="intro-line" viewBox="0 0 600 120" fill="none" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="intro-pulse" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fb7185" stopOpacity="0.2" />
              <stop offset="0.45" stopColor="#fb7185" />
              <stop offset="0.7" stopColor="#f9a8d4" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d={PULSE_PATH} pathLength={1} stroke="url(#intro-pulse)" className="intro-line-glow" />
          <path d={PULSE_PATH} pathLength={1} stroke="url(#intro-pulse)" className="intro-line-path" />
        </svg>
        <p className="intro-word">
          Vita<span>Pulse</span>
        </p>
      </div>
    </div>
  );
}
