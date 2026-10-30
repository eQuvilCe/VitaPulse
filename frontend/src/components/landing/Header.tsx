import Link from "next/link";

// Difference blending keeps the header legible over both putty and ink sections.
export default function Header() {
  return (
    <header className="site-header fixed inset-x-0 top-0 z-40 text-paper mix-blend-difference">
      <div className="mx-auto flex h-16 items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="VitaPulse home"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-current font-serif text-[15px] leading-none"
        >
          V
        </Link>
        <Link href="/login" className="text-[13px] font-medium underline-offset-4 hover:underline">
          Log in
        </Link>
      </div>
    </header>
  );
}
