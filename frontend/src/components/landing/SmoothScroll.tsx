"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

let lenis: Lenis | null = null;

// Scrolls to an in-page anchor, through Lenis when it is running.
export function scrollToHash(hash: string) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  // Both paths honour html's scroll-padding-top (the navbar height), so the
  // section lands flush under the navbar.
  // Wait a frame so a closing mobile menu can release its scroll lock first;
  // `force` still scrolls if Lenis has not restarted yet.
  requestAnimationFrame(() => {
    if (lenis) lenis.scrollTo(el, { duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4), force: true });
    else el.scrollIntoView({ behavior: "smooth" });
  });
  history.replaceState(null, "", hash);
}

// Inertial wheel/trackpad scrolling for the landing. Touch keeps native
// scrolling, and reduced-motion visitors get the browser default.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("lenis-on");
    lenis = new Lenis({ autoRaf: true, lerp: 0.07, wheelMultiplier: 0.8, allowNestedScroll: true });

    // The intro and the mobile menu lock the page; pause Lenis meanwhile.
    // Lenis rewrites its own classes (and overflow) on <html>, so read only our
    // lock classes and act only on a real change, or the observer feeds itself.
    let locked: boolean | null = null;
    const sync = () => {
      const now = root.classList.contains("intro-lock") || root.classList.contains("menu-open");
      if (now === locked) return;
      locked = now;
      if (now) lenis?.stop();
      else lenis?.start();
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Route every in-page anchor through Lenis.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#") return;
      e.preventDefault();
      scrollToHash(a.getAttribute("href")!);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      observer.disconnect();
      lenis?.destroy();
      lenis = null;
      root.classList.remove("lenis-on");
    };
  }, []);

  return null;
}
