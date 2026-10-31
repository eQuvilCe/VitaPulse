"use client";

import {
  Award,
  Camera,
  ClipboardList,
  Gauge,
  LineChart,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ApiError, fetchMe, getToken, logout, saveLanguage, type User } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { useAppT } from "./i18n";
import VitaMark from "./VitaMark";

type NavKey = "plan" | "diary" | "scan" | "coach" | "progress" | "bmi" | "achievements" | "profile";

const NAV: { key: NavKey; href: string; icon: typeof Camera }[] = [
  { key: "plan", href: "/plan", icon: ClipboardList },
  { key: "diary", href: "/diary", icon: NotebookPen },
  { key: "scan", href: "/scan", icon: Camera },
  { key: "coach", href: "/coach", icon: MessageCircle },
  { key: "progress", href: "/progress", icon: LineChart },
  { key: "bmi", href: "/bmi", icon: Gauge },
  { key: "achievements", href: "/achievements", icon: Award },
  { key: "profile", href: "/profile", icon: UserRound },
];

const MOBILE_MAIN: NavKey[] = ["plan", "diary", "scan", "progress"];

const UserContext = createContext<User | null>(null);

export function useUser(): User | null {
  return useContext(UserContext);
}

// Cabinet frame: sidebar on desktop, bottom tab bar with a "More" sheet on phones.
// Visitors without a token are sent to /login and come back afterwards.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t, locale } = useAppT();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setReady(true);
    fetchMe()
      .then(setUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      });
    // Only on mount: navigation inside the cabinet keeps the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The coach writes tips in the profile language, so keep it in step with the switcher.
  useEffect(() => {
    if (user && user.language !== locale) {
      saveLanguage(locale)
        .then(setUser)
        .catch(() => undefined);
    }
  }, [user, locale]);

  useEffect(() => setMoreOpen(false), [pathname]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = !MOBILE_MAIN.some((k) => isActive(NAV.find((n) => n.key === k)!.href));

  if (!ready) {
    return <div className="min-h-screen bg-canvas" aria-busy="true" />;
  }

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-canvas text-fg lg:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur lg:flex">
          <Link href="/plan" className="mb-8 flex items-center gap-2.5 rounded-full px-2 text-[19px] font-semibold tracking-tight">
            <VitaMark />
            <span>
              Vita <span className="font-serif italic font-normal">Health</span>
            </span>
          </Link>
          <nav aria-label={t.nav.main} className="flex-1 space-y-1">
            {NAV.map(({ key, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-field px-3 py-2.5 text-body font-semibold transition-colors duration-200",
                  isActive(href) ? "bg-brand-50 text-brand-800" : "text-fg-muted hover:bg-subtle hover:text-fg",
                )}
              >
                <Icon className={cx("h-[18px] w-[18px]", isActive(href) ? "text-brand-600" : "text-fg-subtle")} aria-hidden="true" />
                {t.nav[key]}
              </Link>
            ))}
          </nav>
          <div className="space-y-3 border-t border-line pt-4">
            {user && (
              <div className="truncate px-3 text-caption text-fg-muted" title={user.email}>
                {user.name || user.email}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 px-1">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t.nav.logout}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/85 px-4 backdrop-blur lg:hidden">
          <Link href="/plan" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
            <VitaMark small />
            <span>
              Vita <span className="font-serif italic font-normal">Health</span>
            </span>
          </Link>
          <LanguageSwitcher />
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        {/* Mobile bottom bar */}
        <nav
          aria-label={t.nav.main}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {MOBILE_MAIN.map((key) => {
              const item = NAV.find((n) => n.key === key)!;
              const active = isActive(item.href);
              const Icon = item.icon;
              const scan = key === "scan";
              return (
                <li key={key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                      active ? "text-brand-700" : "text-fg-muted",
                    )}
                  >
                    <span
                      className={cx(
                        "flex items-center justify-center rounded-full transition-colors",
                        scan ? "h-9 w-9 bg-kcal-500 text-white shadow-card" : "h-7 w-12",
                        !scan && active && "bg-brand-50",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {t.nav[key]}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-expanded={moreOpen}
                className={cx("flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", moreActive ? "text-brand-700" : "text-fg-muted")}
              >
                <span className={cx("flex h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-brand-50")}>
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
                {t.nav.more}
              </button>
            </li>
          </ul>
        </nav>

        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.more}>
            <button type="button" aria-label={t.common.close} className="absolute inset-0 bg-fg/30" onClick={() => setMoreOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 rounded-t-panel bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-raised">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-heading">{t.nav.more}</span>
                <button type="button" onClick={() => setMoreOpen(false)} aria-label={t.common.close} className="rounded-full p-2 text-fg-muted hover:bg-subtle">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {NAV.filter((n) => !MOBILE_MAIN.includes(n.key)).map(({ key, href, icon: Icon }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={isActive(href) ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-3 rounded-card border px-4 py-3.5 text-body font-semibold",
                        isActive(href) ? "border-brand-300 bg-brand-50 text-brand-800" : "border-line text-fg",
                      )}
                    >
                      <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                      {t.nav[key]}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={signOut}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-body font-semibold text-fg-muted hover:bg-subtle"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t.nav.logout}
              </button>
            </div>
          </div>
        )}
      </div>
    </UserContext.Provider>
  );
}
