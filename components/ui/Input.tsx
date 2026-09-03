import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const INPUT_CLASSES =
  "block w-full rounded-lg border border-[var(--glass-border)] bg-space-700/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-2 focus:outline-brand focus:-outline-offset-1 disabled:bg-space-800/50 disabled:text-ink-faint";

export function Input({ label, error, hint, id, name, className, ...props }: InputProps) {
  const inputId = id ?? name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(
          INPUT_CLASSES,
          error && "border-danger focus:border-danger focus:outline-danger",
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
