import Link from "next/link";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
  { href: "/login", label: "Log in" },
];

export default function Footer() {
  return (
    <footer className="bg-chalk px-5 pt-24 text-ink sm:pt-32">
      <div className="flex flex-col items-center text-center">
        <SplitHeading
          as="h2"
          text="Start your rhythm"
          className="font-serif text-[clamp(48px,9vw,94px)] font-normal leading-[0.84] tracking-[-0.009em]"
        />
        <Reveal as="p" delay={150} className="mt-8 max-w-md text-[15px] text-graphite">
          One minute to sign up. Better days, one signal at a time.
        </Reveal>
        <Reveal delay={250} className="mt-8">
          <Link
            href="/register"
            className="inline-block rounded-[28.8px] bg-ink px-[17px] py-[9px] text-xs font-medium text-paper transition-opacity hover:opacity-80"
          >
            Create account
          </Link>
        </Reveal>
      </div>

      <div className="mx-auto mt-28 flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-vellum py-8 text-[13px] text-graphite sm:flex-row">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink font-serif text-[15px] text-ink">
          V
        </span>
        <nav className="flex flex-wrap justify-center gap-6">
          {LINKS.map(({ href, label }) =>
            href.startsWith("/") ? (
              <Link key={href} href={href} className="underline-offset-4 hover:underline">
                {label}
              </Link>
            ) : (
              <a key={href} href={href} className="underline-offset-4 hover:underline">
                {label}
              </a>
            ),
          )}
        </nav>
        <p>© {new Date().getFullYear()} VitaPulse</p>
      </div>
    </footer>
  );
}
