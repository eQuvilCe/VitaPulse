import { forwardRef } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "calorie";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  // Flat green, white text: the one primary action style.
  primary: "border border-transparent bg-accent text-accent-on hover:bg-brand-700",
  // A hairline that darkens on hover.
  secondary: "border border-line-strong bg-transparent text-fg hover:border-fg",
  ghost: "text-fg-muted hover:bg-subtle hover:text-fg",
  calorie: "border border-kcal-700 bg-kcal-600 text-canvas hover:bg-kcal-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-caption",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

// Shared with links that should look like buttons, e.g. <Link className={buttonClasses()}>.
export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cx(base, variants[variant], sizes[size], className);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant, size, className, type = "button", ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses({ variant, size, className })} {...rest} />;
});

export default Button;
