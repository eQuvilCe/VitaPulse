"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LOCALES, useI18n } from "@/i18n/I18nProvider";
import { cx } from "@/lib/cx";
import { useCopy } from "./copy";

// Transparent bar over the hero photo: menu on the left, the wordmark centred,
// language and a ghost button on the right.
export default function Header() {
  const { c } = useCopy();
  const { locale, setLocale } = useI18n();
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
    <header className="absolute inset-x-0 top-0 z-30 text-canvas">
      <div className="mx-auto grid h-20 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
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
            <nav id="site-menu" className="absolute left-0 top-12 w-56 rounded-card border border-fg bg-canvas p-2 text-fg">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-card px-4 py-3 text-[15px] hover:bg-subtle">
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <Link href="/" className="text-lg font-semibold tracking-[-0.02em] sm:text-xl">
          Vita Health
        </Link>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-1 text-caption sm:flex" role="group" aria-label="Language">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                onClick={() => setLocale(l)}
                aria-pressed={l === locale}
                className={cx("rounded-card px-2 py-1 uppercase", l === locale ? "underline underline-offset-4" : "opacity-70 hover:opacity-100")}
              >
                {l}
              </button>
            ))}
          </div>
          <a
            href="#plan"
            className="inline-flex h-10 items-center rounded-card border border-canvas px-4 text-caption font-medium transition-colors hover:bg-canvas hover:text-fg sm:px-5"
          >
            {c.nav.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
