"use client";

import { useEffect, useState } from "react";
import { ECG_PATH } from "./pulse";

const SHOW_MS = 2400;
const LEAVE_MS = 700;
const ECHOES = [3, 2, 1];

// The intro plays on full page loads; client-side navigation back home skips it.
let played = false;

// Full-screen 3D pulse intro. A giant ECG ribbon draws itself while the
// camera swings from a steep angle to face the viewer; the hero wordmark then
// grows out of the spike and glides into place (see .hero-wordmark), so the
// intro hands over to the hero without a cut. The overlay is server-rendered,
// fades out on its own via CSS if JavaScript never runs, and reduced-motion
// users never see it.
export default function IntroLoader() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">(() => (played ? "gone" : "show"));

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played || reduced) {
      // The hero choreography is tied to the intro; show the hero at rest instead.
      root.classList.add("no-intro");
      setPhase("gone");
      return;
    }

    // The wordmark flies in relative to the viewport, so start from the top.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    root.classList.add("intro-lock");

    const leave = window.setTimeout(() => setPhase("leave"), SHOW_MS);
    const gone = window.setTimeout(() => {
      // Marked only once the intro has really finished: StrictMode re-runs effects.
      played = true;
      root.classList.remove("intro-lock");
      setPhase("gone");
    }, SHOW_MS + LEAVE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(gone);
      root.classList.remove("intro-lock");
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`intro ${phase === "leave" ? "intro-leave" : ""}`} aria-hidden="true">
      <div className="intro-scene">
        <div className="intro-stage">
          {ECHOES.map((z) => (
            <svg
              key={z}
              className="intro-ecg intro-echo"
              style={{ "--z": z } as React.CSSProperties}
              viewBox="0 0 1400 360"
              fill="none"
            >
              <path d={ECG_PATH} pathLength={1} />
            </svg>
          ))}
          <svg className="intro-ecg intro-main" viewBox="0 0 1400 360" fill="none">
            <path d={ECG_PATH} pathLength={1} />
          </svg>
        </div>
      </div>
    </div>
  );
}
