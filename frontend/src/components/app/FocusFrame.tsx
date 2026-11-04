import Link from "next/link";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui";

import VitaMark from "./VitaMark";

export default function FocusFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg">
      <header className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Vita Health" className="flex items-center gap-2.5 text-[18px] font-medium tracking-[-0.02em]">
          <VitaMark small />
          <span>Vita Health</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-5xl justify-center px-4 pb-16 pt-6 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}
