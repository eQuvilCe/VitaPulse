"use client";

import { Camera, CheckCircle2, ImageUp, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge, Button, buttonClasses, Card, Input } from "@/components/ui";
import { addMeal, ApiError, scanPhoto, type MealInput } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import CameraCapture from "./CameraCapture";
import { fmt, useAppT } from "./i18n";
import { PageHeader } from "./states";

type Phase = "pick" | "camera" | "analyzing" | "result" | "saved";

const EMPTY: MealInput = { name: "", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export default function ScanView() {
  const { t, locale } = useAppT();
  const [phase, setPhase] = useState<Phase>("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [meal, setMeal] = useState<MealInput>(EMPTY);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function analyze(file: Blob) {
    setPreview(URL.createObjectURL(file));
    setPhase("analyzing");
    setNote(null);
    setConfidence(null);
    try {
      const r = await scanPhoto(file, locale);
      setMeal({ name: r.name, calories: r.calories, protein_g: r.protein_g, carbs_g: r.carbs_g, fat_g: r.fat_g });
      setConfidence(r.confidence != null ? Math.round(r.confidence <= 1 ? r.confidence * 100 : r.confidence) : null);
    } catch (err) {
      setMeal(EMPTY);
      const offline = err instanceof TypeError || (err instanceof ApiError && [404, 405, 501, 503].includes(err.status));
      setNote(offline ? t.scan.offline : t.scan.failed);
    }
    setPhase("result");
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) analyze(file);
  }

  async function save() {
    if (!meal.name.trim()) return;
    setSaving(true);
    setSaveError(false);
    try {
      await addMeal({ ...meal, name: meal.name.trim() });
      setPhase("saved");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setPhase("pick");
    setPreview(null);
    setMeal(EMPTY);
    setNote(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  const numInput = (key: Exclude<keyof MealInput, "name">, label: string, suffix: string) => (
    <Input
      label={label}
      suffix={suffix}
      inputMode="decimal"
      value={meal[key] ? String(meal[key]) : ""}
      onChange={(e) => setMeal((m) => ({ ...m, [key]: Number(e.target.value.replace(",", ".")) || 0 }))}
    />
  );

  return (
    <>
      <PageHeader title={t.scan.title} lead={t.scan.lead} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          {phase === "camera" ? (
            <CameraCapture onCapture={analyze} onClose={() => setPhase("pick")} />
          ) : preview ? (
            <div className="relative overflow-hidden rounded-panel bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
              {phase === "analyzing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-fg/40 text-white backdrop-blur-[2px]" aria-live="polite">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                  <span className="text-body font-semibold">{t.scan.analyzing}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFiles(e.dataTransfer.files);
              }}
              className={cx(
                "flex aspect-[4/3] flex-col items-center justify-center gap-5 rounded-panel border-2 border-dashed p-6 text-center transition-colors",
                dragging ? "border-kcal-500 bg-kcal-50" : "border-line-strong bg-[radial-gradient(70%_70%_at_50%_40%,rgb(var(--vh-kcal-50)),rgb(var(--vh-surface)))]",
              )}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-kcal-100 text-kcal-600" aria-hidden="true">
                <Camera className="h-7 w-7" />
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="calorie" onClick={() => fileInput.current?.click()}>
                  <ImageUp className="h-4 w-4" aria-hidden="true" />
                  {t.scan.upload}
                </Button>
                <Button variant="secondary" onClick={() => setPhase("camera")}>
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {t.scan.camera}
                </Button>
              </div>
              <p className="hidden text-caption text-fg-muted sm:block">{t.scan.drop}</p>
              <button type="button" onClick={() => setPhase("result")} className="text-caption font-semibold text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                {t.scan.manual}
              </button>
            </div>
          )}
          <input ref={fileInput} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFiles(e.target.files)} />
        </div>

        {(phase === "result" || phase === "saved") && (
          <Card className="rounded-panel">
            {phase === "saved" ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center" role="status">
                <CheckCircle2 className="h-12 w-12 text-brand-500" aria-hidden="true" />
                <p className="text-heading">{t.scan.added}</p>
                <p className="text-body text-fg-muted">
                  {meal.name} · {meal.calories} {t.common.kcal}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/diary" className={buttonClasses()}>
                    {t.scan.openDiary}
                  </Link>
                  <Button variant="secondary" onClick={reset}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t.scan.again}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  save();
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-heading">{t.scan.result}</h2>
                  {confidence != null && <Badge tone={confidence >= 70 ? "brand" : "warn"}>{fmt(t.scan.confidence, { n: confidence })}</Badge>}
                </div>
                {note ? (
                  <p className="rounded-field bg-warn-soft px-3 py-2 text-caption text-warn-strong">{note}</p>
                ) : (
                  preview && <p className="text-caption text-fg-muted">{t.scan.fix}</p>
                )}
                <Input label={t.scan.name} required value={meal.name} onChange={(e) => setMeal((m) => ({ ...m, name: e.target.value }))} />
                <div className="rounded-card bg-kcal-50 p-4 ring-1 ring-inset ring-kcal-100">{numInput("calories", t.scan.calories, t.common.kcal)}</div>
                <div className="grid grid-cols-3 gap-3">
                  {numInput("protein_g", t.plan.protein, t.common.g)}
                  {numInput("carbs_g", t.plan.carbs, t.common.g)}
                  {numInput("fat_g", t.plan.fat, t.common.g)}
                </div>
                {saveError && (
                  <p role="alert" className="text-caption text-danger">
                    {t.common.error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" variant="calorie" disabled={saving || !meal.name.trim()}>
                    {saving ? t.common.loading : t.scan.add}
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    {t.scan.again}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
