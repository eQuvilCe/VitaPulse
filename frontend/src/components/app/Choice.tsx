"use client";

import { Check } from "lucide-react";

import { cx } from "@/lib/cx";

type Option<T extends string> = { value: T; label: string; hint?: string; icon?: React.ReactNode };

// Large tappable options for the questionnaire. `multiple` turns it into checkboxes.
export function ChoiceGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label: string;
  hint?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-caption font-semibold text-fg">{label}</legend>
      {hint && <p className="-mt-1 mb-2 text-caption text-fg-muted">{hint}</p>}
      <div role="radiogroup" aria-label={label} className={cx("grid gap-2", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {options.map((o) => (
          <ChoiceButton key={o.value} selected={value === o.value} onClick={() => onChange(o.value)} role="radio" {...o} />
        ))}
      </div>
    </fieldset>
  );
}

export function MultiChoice<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: Option<T>[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-caption font-semibold text-fg">{label}</legend>
      {hint && <p className="-mt-1 mb-2 text-caption text-fg-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className={cx(
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-caption font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus",
                on ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong bg-surface text-fg-muted hover:border-fg-subtle hover:text-fg",
              )}
            >
              {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ChoiceButton({
  label,
  hint,
  icon,
  selected,
  onClick,
  role,
}: Option<string> & { selected: boolean; onClick: () => void; role: string }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        "flex min-h-[52px] items-center gap-3 rounded-field border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:shadow-focus",
        selected ? "border-brand-500 bg-brand-50 shadow-[inset_0_0_0_1px_rgb(var(--vh-brand-500))]" : "border-line-strong bg-surface hover:border-fg-subtle",
      )}
    >
      {icon && <span className={cx("shrink-0", selected ? "text-brand-600" : "text-fg-subtle")}>{icon}</span>}
      <span className="min-w-0">
        <span className={cx("block text-body font-semibold", selected ? "text-brand-800" : "text-fg")}>{label}</span>
        {hint && <span className="block text-caption text-fg-muted">{hint}</span>}
      </span>
    </button>
  );
}
