import { cx } from "@/lib/cx";

type Tone = "brand" | "calorie";

const tones: Record<Tone, { track: string; fill: string }> = {
  brand: { track: "bg-brand-100", fill: "bg-brand-500" },
  calorie: { track: "bg-kcal-100", fill: "bg-kcal-500" },
};

type Props = {
  value: number;
  max?: number;
  tone?: Tone;
  size?: "sm" | "md";
  // Accessible name; shown above the bar together with `valueText` when `showLabel` is set.
  label: string;
  valueText?: string;
  showLabel?: boolean;
  className?: string;
};

export default function Progress({ value, max = 100, tone = "brand", size = "md", label, valueText, showLabel = false, className }: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const { track, fill } = tones[tone];

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-caption">
          <span className="font-semibold text-fg">{label}</span>
          {valueText && <span className="tabular-nums text-fg-muted">{valueText}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
        aria-valuetext={valueText}
        className={cx("overflow-hidden rounded-full", track, size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <div
          className={cx("h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
