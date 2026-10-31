import { cx } from "@/lib/cx";

type Tone = "surface" | "subtle" | "brand" | "calorie";

const tones: Record<Tone, string> = {
  surface: "border border-line bg-surface shadow-card",
  subtle: "bg-subtle",
  brand: "bg-brand-50 ring-1 ring-inset ring-brand-100",
  calorie: "bg-kcal-50 ring-1 ring-inset ring-kcal-100",
};

type Props = React.HTMLAttributes<HTMLDivElement> & { tone?: Tone; padded?: boolean };

export default function Card({ tone = "surface", padded = true, className, ...rest }: Props) {
  return <div className={cx("rounded-card text-fg", tones[tone], padded && "p-5 sm:p-6", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx("text-heading text-fg", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("mt-1 text-body text-fg-muted", className)} {...rest} />;
}
