"use client";

import { useEffect, useRef, useState } from "react";

// easeOutQuint: fast start, a long soft landing.
const ease = (t: number) => 1 - Math.pow(1 - t, 5);

// Animates from the last shown value to `target` (from 0 the first time).
// Reduced-motion visitors get the final value straight away.
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.current = target;
      setValue(target);
      return;
    }
    const from = shown.current;
    let start = 0;
    let frame = requestAnimationFrame(function tick(now) {
      start ||= now;
      const t = Math.min((now - start) / duration, 1);
      shown.current = from + (target - from) * ease(t);
      setValue(shown.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
