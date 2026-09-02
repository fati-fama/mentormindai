import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const INPUT_CLASSES =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500 focus:-outline-offset-1 disabled:bg-slate-100";

export function Input({ label, error, hint, id, name, className, ...props }: InputProps) {
  const inputId = id ?? name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(INPUT_CLASSES, error && "border-rose-400 focus:border-rose-500 focus:outline-rose-500", className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
