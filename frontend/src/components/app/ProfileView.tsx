"use client";

import { ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button, buttonClasses, Card } from "@/components/ui";
import { fetchAchievements, fetchPlan, logout } from "@/lib/api-vita";

import { useUser } from "./AppShell";
import BadgeGrid from "./BadgeGrid";
import { fmt, formatDate, formatNumber, useAppT } from "./i18n";
import { PageHeader, SectionTitle, Skeleton, useLoad } from "./states";

export default function ProfileView() {
  const { t, locale } = useAppT();
  const router = useRouter();
  const user = useUser();
  const ach = useLoad(fetchAchievements);
  const plan = useLoad(() => fetchPlan(locale), [locale]);
  const input = plan.data?.input;
  const o = t.onboarding;

  const initials = (user?.name || user?.email || "?").trim().slice(0, 1).toUpperCase();

  return (
    <>
      <PageHeader title={t.profile.title} />

      <Card className="mb-4 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-heading text-white" aria-hidden="true">
          {initials}
        </span>
        <div className="min-w-0">
          {user ? (
            <>
              <p className="truncate text-heading">{user.name || user.email}</p>
              <p className="truncate text-caption text-fg-muted">
                {user.email} · {fmt(t.profile.since, { date: formatDate(user.created_at, locale, { month: "long", year: "numeric" }) })}
              </p>
            </>
          ) : (
            <Skeleton className="h-10 w-48" />
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle
          aside={
            <Link href="/achievements" className="inline-flex items-center gap-1 text-caption font-semibold text-brand-700 hover:underline">
              {t.profile.all}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
        >
          {t.profile.badges}
        </SectionTitle>
        {ach.data ? <BadgeGrid badges={ach.data.badges} compact /> : <Skeleton className="h-28" />}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle
            aside={
              <Link href="/onboarding" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                {t.profile.editPlan}
              </Link>
            }
          >
            {t.profile.plan}
          </SectionTitle>
          {input ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-body">
              <Row label={o.height} value={`${formatNumber(input.height_cm, locale)} ${t.common.cm}`} />
              <Row label={o.weight} value={`${formatNumber(input.weight_kg, locale, 1)} ${t.common.kg}`} />
              <Row label={o.age} value={`${input.age}`} />
              <Row label={o.sex} value={o[input.sex]} />
              <Row
                label={o.goal}
                value={input.goal === "maintain" ? o.maintain : `${o[input.goal]} · ${formatNumber(input.target_change_kg, locale, 1)} ${t.common.kg}`}
              />
              <Row label={o.place} value={o[input.place]} />
              <Row label={o.activity} value={o[input.activity]} />
              {input.restrictions.length > 0 && <Row label={o.restrictions} value={input.restrictions.map((r) => o[r]).join(", ")} />}
            </dl>
          ) : (
            <Link href="/onboarding" className={buttonClasses({ size: "sm" })}>
              {t.plan.start}
            </Link>
          )}
        </Card>

        <Card>
          <SectionTitle>{t.profile.settings}</SectionTitle>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <span className="text-body">{t.profile.language}</span>
            <LanguageSwitcher />
          </div>
          <Button
            variant="ghost"
            className="mt-3 -ml-3 text-danger hover:bg-danger-soft hover:text-danger"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t.profile.logout}
          </Button>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="font-semibold text-fg">{value}</dd>
    </div>
  );
}
