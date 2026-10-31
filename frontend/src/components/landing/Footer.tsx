"use client";

import Link from "next/link";

import { LOCALES, useI18n } from "@/i18n/I18nProvider";
import { useCopy } from "./copy";

// One line: wordmark, language, sign in, the year and the disclaimer.
export default function Footer() {
  const { c } = useCopy();
  const { locale, setLocale } = useI18n();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-caption text-fg-muted sm:px-8">
        <span className="font-semibold text-fg">Vita Health</span>
        <span>
          © {new Date().getFullYear()} · {c.footer.disclaimer}
        </span>
        <span className="flex items-center gap-4">
          {LOCALES.filter((l) => l !== locale).map((l) => (
            <button key={l} type="button" lang={l} onClick={() => setLocale(l)} className="uppercase hover:text-fg">
              {l}
            </button>
          ))}
          <Link href="/login" className="hover:text-fg">
            {c.nav.login}
          </Link>
        </span>
      </div>
    </footer>
  );
}
