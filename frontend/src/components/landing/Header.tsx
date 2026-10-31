"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import Logo from "./Logo";

const NAV = ["features", "how", "dashboard", "faq"] as const;

// Floating glass navbar: tightens once you scroll, a pill glides under the
// hovered link, the current section stays marked, and phones get a sheet menu.
export default function Header() {
  const { t } = useI18n();
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
    const hero = document.querySelector("#top");
    if (hero) observer.observe(hero);
    NAV.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const target = hovered ?? (active && active !== "top" ? active : null);
  useEffect(() => {
    const el = target ? links.current[target] : null;
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [target, scrolled, t]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
  }, [open]);

  return (
    <header className="hero-in fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 sm:px-5">
      <div
        className={`nav-shell relative w-full rounded-[22px] border border-white/10 text-glow shadow-[0_10px_40px_-12px_rgba(10,6,14,0.55)] backdrop-blur-2xl backdrop-saturate-150 transition-[max-width,padding,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "max-w-4xl bg-plum/[0.97] py-1.5" : scrolled ? "max-w-4xl bg-plum/85 py-1.5" : "max-w-6xl bg-plum/50 py-2.5"
        }`}
      >
        <div className="flex items-center justify-between gap-4 pl-4 pr-2">
          <Link href="/" aria-label={t.brand.home} className="shrink-0 rounded-full">
            <Logo />
          </Link>

          <nav className="relative hidden items-center md:flex" onMouseLeave={() => setHovered(null)}>
            <span
              className="absolute inset-y-0 rounded-full bg-white/10 transition-[left,width,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
                className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-500 ${
                  active === id || hovered === id ? "text-glow" : "text-mist"
                }`}
              >
                {t.nav[id]}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher onDark className="mr-1" />
            <Link href="/login" className="hidden whitespace-nowrap rounded-full px-4 py-2 text-sm text-mist transition-colors duration-500 hover:text-glow sm:block">
              {t.nav.login}
            </Link>
            <Link href="/register" className="btn-warm whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold">
              {t.nav.start}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              className="relative ml-1 h-10 w-10 rounded-full transition-colors hover:bg-white/10 md:hidden"
            >
              <span className={`burger ${open ? "is-open" : ""}`} aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <div id="mobile-menu" className={`menu-sheet md:hidden ${open ? "is-open" : ""}`}>
          <div className="overflow-hidden">
            <nav className="flex flex-col gap-1 px-2 pb-3 pt-3">
              {[...NAV.map((id) => ({ href: `#${id}`, label: t.nav[id] })), { href: "/login", label: t.nav.login }].map(
                ({ href, label }, i) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="menu-item rounded-2xl px-4 py-3 font-serif text-2xl text-glow transition-colors hover:bg-white/5"
                    style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
                  >
                    {label}
                  </a>
                ),
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
