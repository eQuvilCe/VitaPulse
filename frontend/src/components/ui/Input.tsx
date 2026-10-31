import { forwardRef, useId } from "react";

import { cx } from "@/lib/cx";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  // Unit or icon shown inside the field on the right, e.g. "kg".
  suffix?: React.ReactNode;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, suffix, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;

  return (
    <div className={cx("space-y-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="block text-caption font-semibold text-fg">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={cx(
            "h-11 w-full rounded-field border bg-surface px-4 text-body text-fg caret-brand-600 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle focus:shadow-focus disabled:bg-subtle disabled:text-fg-subtle",
            error ? "border-danger focus:border-danger" : "border-line-strong hover:border-fg-subtle focus:border-brand-500",
            suffix ? "pr-12" : undefined,
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-caption text-fg-subtle">{suffix}</span>
        )}
      </div>
      {note && (
        <p id={noteId} className={cx("text-caption", error ? "text-danger" : "text-fg-muted")}>
          {note}
        </p>
      )}
    </div>
  );
});

export default Input;
