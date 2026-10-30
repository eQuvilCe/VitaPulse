"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RIPPLE_EVENT } from "../rhythm";

// three.js only loads when the intro actually plays.
const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false });

const READY_TIMEOUT_MS = 2500;
const HARD_TIMEOUT_MS = 6500;
const RIPPLE_MS = 1250;

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

// Full-screen 3D ECG intro. On the final beat's peak a ripple opens the overlay
// from that point and hands its wave over to the hero field underneath.
// The overlay is server-rendered so the page never flashes, a CSS failsafe in
// globals.css hides it if JavaScript never runs, and reduced-motion, weak or
// WebGL-less devices go straight to the site.
export default function IntroLoader() {
  const [phase, setPhase] = useState<"show" | "ripple" | "done" | "gone">(() => (played ? "gone" : "show"));
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [play, setPlay] = useState(false);
  const [started, setStarted] = useState(false);
  const ready = useRef(false);
  const rippled = useRef(false);
  const timers = useRef<number[]>([]);

  const ripple = (x: number, y: number) => {
    rippled.current = true;
    window.dispatchEvent(new CustomEvent(RIPPLE_EVENT, { detail: { x, y } }));
  };

  const finish = useCallback(() => {
    played = true;
    // Bailed out before the peak: still wake the hero field with a centred wave.
    if (!rippled.current) ripple(window.innerWidth / 2, window.innerHeight / 2);
    const root = document.documentElement;
    root.classList.remove("intro-lock", "intro-pending");
    root.classList.add("intro-done");
    // Hide now, but tear the WebGL scene down only when the browser is idle so
    // disposing it never hitches the hero's entrance.
    setPhase("done");
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => setPhase("gone"), { timeout: 2500 });
  }, []);

  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    if (played || !canPlay()) {
      rippled.current = true;
      root.classList.add("intro-done", "intro-skip");
      setPhase("gone");
      return;
    }
    // Hide the hero content under the overlay; it rises once the ripple opens.
    root.classList.add("intro-pending", "intro-lock");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    setPlay(true);

    const t = timers.current;
    t.push(window.setTimeout(() => !ready.current && finish(), READY_TIMEOUT_MS));
    t.push(window.setTimeout(finish, HARD_TIMEOUT_MS));
    return () => {
      t.forEach(window.clearTimeout);
      t.length = 0;
      root.classList.remove("intro-lock");
    };
  }, [finish]);

  const onPeak = useCallback(
    (x: number, y: number) => {
      setOrigin({ x, y });
      setPhase("ripple");
      document.documentElement.classList.add("intro-done");
      ripple(x, y);
      timers.current.push(window.setTimeout(finish, RIPPLE_MS));
    },
    [finish],
  );

  if (phase === "gone") return null;

  return (
    <div
      className={`intro ${phase === "ripple" ? "intro-ripple" : ""} ${phase === "done" ? "hidden" : ""}`}
      style={{ "--rx": `${origin.x}px`, "--ry": `${origin.y}px` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={`intro-canvas ${started ? "is-on" : ""}`}>
        {play && (
          <IntroScene
            onStart={() => {
              ready.current = true;
              setStarted(true);
            }}
            onPeak={onPeak}
          />
        )}
      </div>
      <div className="intro-ring" />
      <div className="intro-flash" />
    </div>
  );
}
