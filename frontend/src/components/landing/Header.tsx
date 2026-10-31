"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LanguageToggle, ThemeToggle } from "@/components/ui";
import { useCopy } from "./copy";

// Transparent bar over the hero video (cream in both themes): menu on the
// left, the wordmark centred, theme, language and a ghost button on the right.
export default function Header() {
  const { c } = useCopy();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: "#features", label: c.nav.features },
    { href: "#plan", label: c.nav.plan },
    { href: "/login", label: c.nav.login },
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-30 text-cream">
      <div className="mx-auto grid h-20 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-3 sm:px-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="rounded-card px-1 py-2 text-[15px] font-medium underline-offset-4 hover:underline"
          >
            {open ? c.nav.close : c.nav.menu}
          </button>
          {open && (
            <nav id="site-menu" className="absolute left-0 top-12 w-56 rounded-card border border-line-strong bg-canvas p-2 text-fg">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-card px-4 py-3 text-[15px] hover:bg-subtle">
                  {l.label}
                </a>
              ))}
              <a href="#plan" onClick={() => setOpen(false)} className="block rounded-card px-4 py-3 text-[15px] font-medium hover:bg-subtle sm:hidden">
                {c.nav.cta}
              </a>
            </nav>
          )}
        </div>

        <Link href="/" className="whitespace-nowrap text-lg font-semibold tracking-[-0.02em] sm:text-xl">
          Vita Health
        </Link>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <a
            href="#plan"
            className="hidden h-10 items-center whitespace-nowrap rounded-card border border-cream px-5 text-caption font-medium transition-colors hover:bg-cream hover:text-ink sm:inline-flex"
          >
            {c.nav.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
