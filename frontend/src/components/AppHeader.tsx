"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import Logo from "@/components/landing/Logo";
import { logout } from "@/lib/auth";

export type NavItem = { href: string; label: string };

type Props = {
  links?: NavItem[];
};

export default function AppHeader({ links = [{ href: "/dashboard", label: "Dashboard" }] }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Logo />
      <nav aria-label="Main" className="flex items-center gap-1 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={pathname === l.href ? "page" : undefined}
            className={`rounded-full px-3 py-2 transition-colors duration-300 hover:bg-white/5 ${
              pathname === l.href ? "bg-white/5 text-glow" : "text-mist"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-mist transition-colors duration-300 hover:bg-white/5 hover:text-glow"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </nav>
    </header>
  );
}
