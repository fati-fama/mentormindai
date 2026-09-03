"use client";

interface UserProfileCardProps {
  name: string | null;
  educationLevel?: string | null;
}

export function UserProfileCard({ name, educationLevel }: UserProfileCardProps) {
  return (
    <div className="mx-3 mt-auto mb-3 flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-bold text-brand">
        {(name ?? "S").charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-strong">{name ?? "Student"}</p>
        {educationLevel && (
          <p className="truncate text-xs text-ink-faint">{educationLevel}</p>
        )}
      </div>
    </div>
  );
}
