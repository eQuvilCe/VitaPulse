import { cx } from "@/lib/cx";

type Tone = "surface" | "subtle" | "brand" | "calorie" | "accent";

const tones: Record<Tone, string> = {
  // White with a hairline: no shadow.
  surface: "border border-line bg-surface text-fg",
  subtle: "bg-subtle text-fg",
  brand: "border border-line bg-brand-50 text-fg",
  calorie: "border border-kcal-300/60 bg-kcal-50 text-fg",
  // The flat green block, for one highlighted card per screen.
  accent: "border border-transparent bg-accent text-accent-on",
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
