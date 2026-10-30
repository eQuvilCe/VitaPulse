import Link from "next/link";
import { HeartPulse } from "lucide-react";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <HeartPulse className="h-6 w-6 text-pulse" />
          <span>
            Vita<span className="text-accent">Pulse</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-full px-4 py-2 text-slate-300 transition-colors hover:text-white">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-accent px-4 py-2 font-medium text-bg transition-transform hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
