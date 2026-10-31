import { forwardRef } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "calorie";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:shadow-focus active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white shadow-card hover:bg-brand-800",
  secondary: "border border-line-strong bg-surface text-fg hover:border-brand-300 hover:bg-brand-50",
  ghost: "text-fg-muted hover:bg-subtle hover:text-fg",
  calorie: "bg-kcal-600 text-white shadow-card hover:bg-kcal-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-caption",
  md: "h-11 px-5 text-body",
  lg: "h-12 px-7 text-lead",
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
