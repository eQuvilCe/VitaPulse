"use client";

import { Check, Dumbbell, ImagePlus, Lock, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { Button, Card, Input } from "@/components/ui";
import { addDays, isoDay } from "@/lib/dates";
import {
  addMeasurement,
  authedObjectUrl,
  deletePhoto,
  deleteWorkout,
  fetchPlan,
  listMeasurements,
  listPhotos,
  listWorkouts,
  logWeight,
  logWorkout,
  uploadPhoto,
  weightTrend,
  type MeasurementInput,
  type ProgressPhoto,
  type WorkoutLog,
} from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { fmt, formatDate, formatNumber, useAppT } from "./i18n";
import { ErrorBlock, PageHeader, SectionTitle, Skeleton, useLoad } from "./states";

const WeightChart = dynamic(() => import("./WeightChart"), { ssr: false, loading: () => <Skeleton className="h-64" /> });

const RANGES = ["30", "90", "365"] as const;

export default function ProgressView() {
  const { t } = useAppT();
  return (
    <>
      <PageHeader title={t.progress.title} />
      <div className="space-y-4">
        <WeightSection />
        <div className="grid gap-4 lg:grid-cols-2">
          <MeasurementsSection />
          <WorkoutsSection />
        </div>
        <PhotosSection />
      </div>
    </>
  );
}

function WeightSection() {
  const { t, locale } = useAppT();
  const [range, setRange] = useState<(typeof RANGES)[number]>("90");
  const trend = useLoad(() => weightTrend(Number(range)), [range]);
  const plan = useLoad(() => fetchPlan(locale), [locale]);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const input = plan.data?.input;
  const goal = input && input.goal !== "maintain" ? input.weight_kg + (input.goal === "lose" ? -1 : 1) * input.target_change_kg : null;
  const points = trend.data?.points ?? [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const kg = Number(value.replace(",", "."));
    if (!kg || kg < 30 || kg > 400) return;
    setSaving(true);
    try {
      await logWeight(kg);
      setValue("");
      trend.reload();
    } finally {
      setSaving(false);
    }
  }

  const span = points.length > 1 ? Math.round((new Date(points[points.length - 1].day).getTime() - new Date(points[0].day).getTime()) / 864e5) : 0;

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-heading">{t.progress.weight}</h2>
          {trend.data?.latest_kg != null && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-caption text-fg-muted">
              <span className="text-title font-semibold tabular-nums text-fg">
                {formatNumber(trend.data.latest_kg, locale, 1)}
                <span className="ml-1 text-body font-normal text-fg-muted">{t.common.kg}</span>
              </span>
              {trend.data.change_kg != null && (
                <span className={cx("font-semibold", trend.data.change_kg < 0 ? "text-brand-700" : "text-kcal-600")}>
                  {fmt(t.progress.change, { n: `${trend.data.change_kg > 0 ? "+" : ""}${formatNumber(trend.data.change_kg, locale, 1)}`, d: span })}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="inline-flex self-start rounded-full bg-subtle p-1 ring-1 ring-inset ring-line" role="group" aria-label={t.progress.weight}>
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cx("rounded-full px-3 py-1.5 text-caption font-semibold", range === r ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg")}
            >
              {t.progress.range[r]}
            </button>
          ))}
        </div>
      </div>

      {trend.error ? (
        <ErrorBlock onRetry={trend.reload} />
      ) : trend.loading && !trend.data ? (
        <Skeleton className="h-64" />
      ) : points.length ? (
        <WeightChart points={points} goal={goal} />
      ) : (
        <p className="flex h-40 items-center justify-center rounded-card bg-subtle text-body text-fg-muted">{t.progress.noWeight}</p>
      )}

      <form onSubmit={save} className="mt-4 flex items-end gap-2 border-t border-line pt-4">
        <Input label={t.progress.logWeight} suffix={t.common.kg} inputMode="decimal" className="max-w-[220px] flex-1" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button type="submit" disabled={saving || !value}>
          {t.common.save}
        </Button>
      </form>
    </Card>
  );
}

function MeasurementsSection() {
  const { t, locale } = useAppT();
  const rows = useLoad(listMeasurements);
  const [form, setForm] = useState<Record<"waist_cm" | "hips_cm" | "chest_cm", string>>({ waist_cm: "", hips_cm: "", chest_cm: "" });
  const [saved, setSaved] = useState(false);

  const list = rows.data ?? [];
  const latest = list[list.length - 1];
  const first = list[0];
  const fields = [
    ["waist_cm", t.progress.waist],
    ["hips_cm", t.progress.hips],
    ["chest_cm", t.progress.chest],
  ] as const;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const m: MeasurementInput = { day: isoDay(new Date()) };
    for (const [k] of fields) {
      const v = Number(form[k].replace(",", "."));
      if (v > 20 && v < 300) m[k] = v;
    }
    if (!m.waist_cm && !m.hips_cm && !m.chest_cm) return;
    await addMeasurement(m);
    setForm({ waist_cm: "", hips_cm: "", chest_cm: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    rows.reload();
  }

  return (
    <Card>
      <SectionTitle aside={latest && <span className="text-caption text-fg-muted">{formatDate(latest.day, locale, { day: "numeric", month: "short" })}</span>}>
        {t.progress.measurements}
      </SectionTitle>
      {latest ? (
        <dl className="mb-4 grid grid-cols-3 gap-3">
          {fields.map(([k, label]) => {
            const v = latest[k];
            const d = v != null && first && first !== latest && first[k] != null ? v - (first[k] as number) : null;
            return (
              <div key={k} className="rounded-field bg-subtle px-3 py-2.5">
                <dt className="text-caption text-fg-muted">{label}</dt>
                <dd className="text-heading tabular-nums">
                  {v != null ? formatNumber(v, locale, 1) : "—"}
                  {d != null && d !== 0 && (
                    <span className={cx("ml-1 text-caption font-semibold", d < 0 ? "text-brand-700" : "text-kcal-600")}>
                      {d > 0 ? "+" : ""}
                      {formatNumber(d, locale, 1)}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mb-4 text-body text-fg-muted">{t.progress.noMeasure}</p>
      )}
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {fields.map(([k, label]) => (
            <Input key={k} label={label} suffix={t.common.cm} inputMode="decimal" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
          ))}
        </div>
        <Button type="submit" size="sm" variant="secondary">
          {saved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {saved ? t.common.saved : t.progress.addMeasure}
        </Button>
      </form>
    </Card>
  );
}

function WorkoutsSection() {
  const { t, locale } = useAppT();
  const logs = useLoad(listWorkouts);
  const [title, setTitle] = useState("");
  const list = logs.data ?? [];
  const weekAgo = isoDay(addDays(new Date(), -6));
  const thisWeek = list.filter((l) => l.day >= weekAgo).length;

  // Dots for the last 14 days.
  const days = Array.from({ length: 14 }, (_, i) => isoDay(addDays(new Date(), i - 13)));
  const done = new Set(list.map((l) => l.day));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await logWorkout(title.trim());
    setTitle("");
    logs.reload();
  }

  async function remove(w: WorkoutLog) {
    logs.setData(list.filter((x) => x.id !== w.id));
    await deleteWorkout(w.id).catch(logs.reload);
  }

  return (
    <Card>
      <SectionTitle aside={<span className="text-caption font-semibold text-brand-700">{fmt(t.progress.thisWeek, { n: thisWeek })}</span>}>{t.progress.workouts}</SectionTitle>
      <ul className="mb-4 flex justify-between gap-1" aria-label={t.progress.workouts}>
        {days.map((d) => (
          <li
            key={d}
            title={formatDate(d, locale, { day: "numeric", month: "short" })}
            className={cx("h-7 flex-1 rounded-md", done.has(d) ? "bg-brand-500" : "bg-subtle", d === isoDay(new Date()) && "ring-2 ring-brand-300 ring-offset-1")}
          >
            <span className="sr-only">
              {formatDate(d, locale, { day: "numeric", month: "short" })}: {done.has(d) ? t.plan.done : "—"}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mb-3 flex items-end gap-2">
        <Input label={t.progress.workoutName} className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={!title.trim()}>
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t.progress.logWorkout}</span>
        </Button>
      </form>
      {list.length ? (
        <ul className="max-h-48 divide-y divide-line overflow-y-auto">
          {list.slice(0, 20).map((w) => (
            <li key={w.id} className="flex items-center gap-3 py-2">
              <span className="w-16 shrink-0 text-caption tabular-nums text-fg-subtle">{formatDate(w.day, locale, { day: "numeric", month: "short" })}</span>
              <span className="flex-1 truncate text-body">{w.title}</span>
              <button type="button" onClick={() => remove(w)} aria-label={`${t.diary.remove}: ${w.title}`} className="rounded-full p-1.5 text-fg-subtle hover:bg-danger-soft hover:text-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body text-fg-muted">{t.progress.noWorkouts}</p>
      )}
    </Card>
  );
}

function PhotosSection() {
  const { t } = useAppT();
  const photos = useLoad(listPhotos);
  const list = photos.data ?? [];
  const before = list.filter((p) => p.kind === "before").sort((a, b) => a.day.localeCompare(b.day))[0];
  const after = list.filter((p) => p.kind === "after").sort((a, b) => b.day.localeCompare(a.day))[0];

  return (
    <Card>
      <SectionTitle
        aside={
          <span className="inline-flex items-center gap-1.5 text-caption text-fg-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {t.progress.photosPrivate}
          </span>
        }
      >
        {t.progress.photos}
      </SectionTitle>
      <div className="grid max-w-xl grid-cols-2 gap-3 sm:gap-4">
        <PhotoSlot kind="before" photo={before} onChange={photos.reload} />
        <PhotoSlot kind="after" photo={after} onChange={photos.reload} />
      </div>
    </Card>
  );
}

function PhotoSlot({ kind, photo, onChange }: { kind: ProgressPhoto["kind"]; photo?: ProgressPhoto; onChange: () => void }) {
  const { t, locale } = useAppT();
  const input = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    setSrc(null);
    if (photo) {
      authedObjectUrl(photo.url)
        .then((u) => {
          url = u;
          setSrc(u);
        })
        .catch(() => setSrc(null));
    }
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [photo]);

  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    setFailed(false);
    try {
      await uploadPhoto(f, kind);
      onChange();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const label = kind === "before" ? t.progress.before : t.progress.after;

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-subtle">
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={async () => {
                if (photo) await deletePhoto(photo.id);
                onChange();
              }}
              aria-label={t.progress.removePhoto}
              className="absolute right-2 top-2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-line-strong text-fg-muted transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            style={{ borderRadius: "inherit" }}
          >
            <ImagePlus className="h-7 w-7" aria-hidden="true" />
            <span className="text-caption font-semibold">{busy ? t.common.loading : t.progress.addPhoto}</span>
          </button>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2.5 py-1 text-caption font-semibold text-fg shadow-card">{label}</span>
      </div>
      <p className="mt-1.5 text-caption text-fg-muted">
        {photo ? formatDate(photo.day, locale) : " "}
        {failed && <span className="text-danger"> · {t.common.error}</span>}
      </p>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
