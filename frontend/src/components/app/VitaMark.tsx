import { cx } from "@/lib/cx";

// Light-theme logo mark: a pulse line in a mint disc.
export default function VitaMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-white",
        small ? "h-7 w-7" : "h-8 w-8",
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 28 16" className={small ? "h-3 w-4" : "h-3.5 w-5"}>
        <path d="M1 9h6.5l2-3 2.5 7.5 3.5-12 2.5 7.5H27" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
