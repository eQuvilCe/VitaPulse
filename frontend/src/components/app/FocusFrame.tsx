import Link from "next/link";

import LanguageSwitcher from "@/components/LanguageSwitcher";

import VitaMark from "./VitaMark";

export default function FocusFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_80%_at_20%_0%,rgb(var(--vh-brand-100)/0.9),transparent_70%),radial-gradient(50%_70%_at_90%_10%,rgb(var(--vh-kcal-100)/0.7),transparent_70%)]"
        aria-hidden="true"
      />
      <header className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Vita Health" className="flex items-center gap-2.5 text-[18px] font-semibold tracking-tight">
          <VitaMark small />
          <span>
            Vita <span className="font-serif italic font-normal">Health</span>
          </span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="relative mx-auto flex w-full max-w-5xl justify-center px-4 pb-16 pt-6 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}
