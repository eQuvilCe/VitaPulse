"use client";

import Link from "next/link";

import { useCopy } from "./copy";
import Logo from "./Logo";

export default function Footer() {
  const { c } = useCopy();
  const links = [
    { href: "#how", label: c.nav.how },
    { href: "#features", label: c.nav.features },
    { href: "#recipes", label: c.nav.recipes },
    { href: "#faq", label: c.nav.faq },
  ];

  return (
    <footer className="border-t border-line px-4 pb-10 pt-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-body text-fg-muted">{c.footer.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-body text-fg-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-brand-700">
              {l.label}
            </a>
          ))}
          <Link href="/login" className="transition-colors hover:text-brand-700">
            {c.nav.login}
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-caption text-fg-subtle">
        © {new Date().getFullYear()} Vita Health · {c.footer.disclaimer}
      </p>
    </footer>
  );
}
