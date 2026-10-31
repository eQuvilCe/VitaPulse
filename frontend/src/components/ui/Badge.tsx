import { cx } from "@/lib/cx";

type Tone = "neutral" | "brand" | "calorie" | "warn" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-fg-muted",
  brand: "bg-brand-100 text-brand-800",
  calorie: "bg-kcal-100 text-kcal-700",
  warn: "bg-warn-soft text-warn-strong",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

type Props = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export default function Badge({ tone = "neutral", className, ...rest }: Props) {
  return (
    <span
      className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-semibold", tones[tone], className)}
      {...rest}
    />
  );
}
