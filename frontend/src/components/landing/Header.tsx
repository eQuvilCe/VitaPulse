"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { buttonClasses } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useCopy } from "./copy";
import Logo from "./Logo";

const NAV = ["how", "features", "recipes", "faq"] as const;

// Floating glass navbar: tightens once you scroll, a pill glides under the
// hovered link, the current section stays marked, and phones get a sheet menu.
export default function Header() {
  const { c } = useCopy();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The section crossing the upper third of the viewport is the active one.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    ["top", "plan", ...NAV].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const target = hovered ?? (active && (NAV as readonly string[]).includes(active) ? active : null);
  useEffect(() => {
    const el = target ? links.current[target] : null;
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [target, scrolled, c]);

  useEffect(() => {
    document.documentElement.classList.toggle("vl-menu", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="vl-in fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 sm:px-5">
      <div
        className={cx(
          "relative w-full rounded-[22px] border backdrop-blur-xl backdrop-saturate-150 transition-[max-width,padding,background-color,box-shadow,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open || scrolled
            ? "max-w-5xl border-line bg-surface/90 py-1.5 shadow-raised"
            : "max-w-6xl border-transparent bg-surface/50 py-2.5",
        )}
      >
        <div className="flex items-center justify-between gap-3 pl-4 pr-2">
          <Link href="/" aria-label="Vita Health" className="shrink-0 rounded-full">
            <Logo />
          </Link>

          <nav className="relative hidden items-center lg:flex" onMouseLeave={() => setHovered(null)}>
            <span
              className="absolute inset-y-0 rounded-full bg-brand-50 transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
              aria-hidden="true"
            />
            {NAV.map((id) => (
              <a
                key={id}
                ref={(el) => {
                  links.current[id] = el;
                }}
                href={`#${id}`}
                onMouseEnter={() => setHovered(id)}
                aria-current={active === id ? "true" : undefined}
                className={cx(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                  active === id || hovered === id ? "text-brand-800" : "text-fg-muted",
                )}
              >
                {c.nav[id]}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher className="mr-1" />
            <Link
              href="/login"
              className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg sm:block"
            >
              {c.nav.login}
            </Link>
            <a href="#plan" className={buttonClasses({ size: "sm", className: "hidden whitespace-nowrap px-5 min-[400px]:inline-flex" })}>
              {c.nav.cta}
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? c.nav.closeMenu : c.nav.openMenu}
              className="relative ml-0.5 h-10 w-10 rounded-full text-fg transition-colors hover:bg-subtle lg:hidden"
            >
              <span className={cx("vl-burger", open && "is-open")} aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <div id="mobile-menu" className={cx("vl-menu-sheet lg:hidden", open && "is-open")}>
          <div className="overflow-hidden">
            <nav className="flex flex-col gap-1 px-2 pb-3 pt-3">
              {[
                ...NAV.map((id) => ({ href: `#${id}`, label: c.nav[id] })),
                { href: "/login", label: c.nav.login },
                { href: "#plan", label: c.nav.cta },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  tabIndex={open ? undefined : -1}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 font-serif text-2xl text-fg transition-colors hover:bg-brand-50"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
