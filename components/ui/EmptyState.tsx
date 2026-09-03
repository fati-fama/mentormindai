import { cn } from "@/utils";
import { RobotIcon } from "./icons";

interface EmptyStateProps {
  title: string;
  body?: string;
  cta?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, body, cta, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-space-800 border border-space-600/40 text-ink-faint">
        <RobotIcon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-ink-strong">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm text-ink-muted">{body}</p>}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
