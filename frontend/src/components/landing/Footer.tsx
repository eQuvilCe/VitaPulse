import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import Reveal from "./Reveal";

export default function Footer() {
  return (
    <footer className="relative pt-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-to-br from-accent/15 via-card to-card px-6 py-14 text-center sm:px-12">
            <div className="hero-aurora opacity-60" aria-hidden="true" />
            <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">
              Start feeling your pulse today
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-slate-400">
              One minute to sign up. A lifetime of better days.
            </p>
            <Link
              href="/register"
              className="btn-shine group relative mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/5 py-10 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2 text-slate-300">
            <HeartPulse className="h-5 w-5 text-pulse" />
            <span className="font-semibold">
              Vita<span className="text-accent">Pulse</span>
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/login" className="hover:text-white">Log in</Link>
          </nav>
          <p>© {new Date().getFullYear()} VitaPulse</p>
        </div>
      </div>
    </footer>
  );
}
