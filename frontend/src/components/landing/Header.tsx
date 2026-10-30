import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="hero-in fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-night/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="VitaPulse home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-sage md:flex">
          <a href="#features" className="transition-colors hover:text-bone">Features</a>
          <a href="#how" className="transition-colors hover:text-bone">How it works</a>
          <a href="#faq" className="transition-colors hover:text-bone">FAQ</a>
        </nav>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/login" className="rounded-full px-4 py-2 text-sage transition-colors hover:text-bone">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-mint px-4 py-2 font-semibold text-night transition-[filter] hover:brightness-110"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
