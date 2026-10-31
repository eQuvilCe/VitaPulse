import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-plum px-5 pb-10 text-glow sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-white/10 pt-10 text-sm text-mist sm:flex-row">
        <Logo />
        <nav className="flex flex-wrap justify-center gap-6">
          <a href="#features" className="link-soft">Features</a>
          <a href="#how" className="link-soft">How it works</a>
          <a href="#faq" className="link-soft">FAQ</a>
          <Link href="/login" className="link-soft">Log in</Link>
        </nav>
        <p>© {new Date().getFullYear()} Vita Health · Not medical advice</p>
      </div>
    </footer>
  );
}
