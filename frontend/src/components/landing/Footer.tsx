import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm text-sage sm:flex-row">
        <Logo />
        <nav className="flex flex-wrap justify-center gap-6">
          <a href="#features" className="hover:text-bone">Features</a>
          <a href="#how" className="hover:text-bone">How it works</a>
          <a href="#faq" className="hover:text-bone">FAQ</a>
          <Link href="/login" className="hover:text-bone">Log in</Link>
        </nav>
        <p>© {new Date().getFullYear()} VitaPulse · Not medical advice</p>
      </div>
    </footer>
  );
}
