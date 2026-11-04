"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import VitaMark from "@/components/app/VitaMark";
import { buttonClasses, LanguageToggle, ThemeToggle } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useCopy } from "./copy";

// Plain bar: wordmark, three anchors, theme and language, log in, one button.
// A hairline appears under it once the page scrolls.
export default function Header() {
  const { c } = useCopy();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: "#features", label: c.nav.features },
    { href: "#how", label: c.nav.how },
    { href: "#plan", label: c.nav.plan },
  ];

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 border-b bg-canvas transition-colors duration-300",
        scrolled || open ? "border-line" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
          <VitaMark small />
          Vita Health
        </Link>

        <nav className="hidden items-center gap-9 text-[15px] text-fg-muted md:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/login" className="ml-2 hidden text-[15px] font-medium transition-colors hover:text-accent lg:inline">
            {c.nav.login}
          </Link>
          <a href="#plan" className={buttonClasses({ size: "sm", className: "hidden sm:inline-flex" })}>
            {c.nav.cta}
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="ml-1 rounded-full px-3 py-2 text-[15px] font-medium md:hidden"
          >
            {open ? c.nav.close : c.nav.menu}
          </button>
        </div>
      </div>

      {open && (
        <nav id="site-menu" className="border-t border-line px-4 pb-4 pt-2 md:hidden">
          {[...links, { href: "/login", label: c.nav.login }].map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-4 text-lg last:border-0">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
