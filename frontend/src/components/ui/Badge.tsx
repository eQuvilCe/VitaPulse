import { cx } from "@/lib/cx";

type Tone = "neutral" | "brand" | "calorie" | "warn" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-line text-fg-muted",
  brand: "border-fg text-fg",
  calorie: "border-kcal-300 bg-kcal-50 text-kcal-700",
  warn: "bg-warn-soft text-warn-strong",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

type Props = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export default function Badge({ tone = "neutral", className, ...rest }: Props) {
  return (
    <span
      className={cx("inline-flex items-center gap-1 rounded-card border border-transparent px-3 py-0.5 text-caption font-medium", tones[tone], className)}
      {...rest}
    />
  );
}
