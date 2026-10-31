import { cx } from "@/lib/cx";

type Tone = "surface" | "subtle" | "brand" | "calorie" | "accent";

const tones: Record<Tone, string> = {
  // A 1px outline (black in light, cream at ~20% in dark): no shadows anywhere.
  surface: "border border-line-strong bg-surface text-fg",
  subtle: "bg-subtle text-fg",
  brand: "border border-line bg-subtle text-fg",
  calorie: "border border-kcal-300 bg-kcal-50 text-fg",
  // The single violet accent, for one highlighted block per screen.
  accent: "border border-accent bg-accent text-accent-on",
};

type Props = React.HTMLAttributes<HTMLDivElement> & { tone?: Tone; padded?: boolean };

export default function Card({ tone = "surface", padded = true, className, ...rest }: Props) {
  return <div className={cx("rounded-card", tones[tone], padded && "p-6", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx("text-heading", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("mt-1 text-body opacity-75", className)} {...rest} />;
}
