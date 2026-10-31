"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useCopy } from "../copy";

// three.js only loads when the intro actually plays.
const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false });

const READY_TIMEOUT_MS = 2500;
const HARD_TIMEOUT_MS = 11000;
const RIPPLE_MS = 1500;

// The intro plays on full page loads; client-side navigation back home skips it.
let played = false;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function canPlay() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Full-screen 3D ECG intro: the pulse runs into the night, then writes VITA
// and a ripple opens the dark overlay from the word onto the light hero.
// The overlay is server-rendered so the page never flashes, a CSS failsafe in
// landing.css hides it if JavaScript never runs, and reduced-motion, weak or
// WebGL-less devices go straight to the site.
export default function IntroLoader() {
  const { c } = useCopy();
  const [phase, setPhase] = useState<"show" | "ripple" | "done" | "gone">(() => (played ? "gone" : "show"));
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [play, setPlay] = useState(false);
  const [started, setStarted] = useState(false);
  const ready = useRef(false);
  const rippling = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    played = true;
    const root = document.documentElement;
    root.classList.remove("vl-lock", "vl-pending");
    root.classList.add("vl-done");
    // Hide now, but tear the WebGL scene down only when the browser is idle so
    // disposing it never hitches the hero's entrance.
    setPhase("done");
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => setPhase("gone"), { timeout: 2500 });
  }, []);

  // Opens the overlay from (x, y); the hero rises as it goes.
  const ripple = useCallback(
    (x: number, y: number) => {
      if (rippling.current) return;
      rippling.current = true;
      setOrigin({ x, y });
      setPhase("ripple");
      document.documentElement.classList.add("vl-done");
      timers.current.push(window.setTimeout(finish, RIPPLE_MS));
    },
    [finish],
  );

  const skip = useCallback(() => ripple(window.innerWidth / 2, window.innerHeight / 2), [ripple]);

  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    if (played || !canPlay()) {
      root.classList.add("vl-done", "vl-skip");
      setPhase("gone");
      return;
    }
    // Hide the hero content under the overlay; it rises once the ripple opens.
    root.classList.add("vl-pending", "vl-lock");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    setPlay(true);

    const t = timers.current;
    t.push(window.setTimeout(() => !ready.current && finish(), READY_TIMEOUT_MS));
    t.push(window.setTimeout(finish, HARD_TIMEOUT_MS));
    return () => {
      t.forEach(window.clearTimeout);
      t.length = 0;
      root.classList.remove("vl-lock");
    };
  }, [finish]);

  useEffect(() => {
    if (phase !== "show") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, skip]);

  if (phase === "gone") return null;

  return (
    <div
      className={`vl-intro ${phase === "ripple" ? "is-ripple" : ""} ${phase === "done" ? "hidden" : ""}`}
      style={{ "--rx": `${origin.x}px`, "--ry": `${origin.y}px` } as React.CSSProperties}
    >
      <div className={`vl-intro-canvas ${started ? "is-on" : ""}`} aria-hidden="true">
        {play && (
          <IntroScene
            onStart={() => {
              ready.current = true;
              setStarted(true);
            }}
            onPeak={ripple}
          />
        )}
      </div>
      <div className="vl-intro-ring" aria-hidden="true" />
      <div className="vl-intro-flash" aria-hidden="true" />
      {phase === "show" && (
        <button type="button" onClick={skip} className="vl-intro-skip">
          {c.intro.skip}
        </button>
      )}
    </div>
  );
}
