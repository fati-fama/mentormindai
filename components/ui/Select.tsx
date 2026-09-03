import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

const SELECT_CLASSES =
  "block w-full rounded-lg border border-[var(--glass-border)] bg-space-700/60 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-2 focus:outline-brand focus:-outline-offset-1 disabled:bg-space-800/50 disabled:text-ink-faint";

export function Select({ label, options, error, hint, placeholder, id, name, className, ...props }: SelectProps) {
  const selectId = id ?? name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-ink-muted">
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(
          SELECT_CLASSES,
          error && "border-danger focus:border-danger focus:outline-danger",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
