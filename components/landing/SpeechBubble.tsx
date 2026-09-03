import { cn } from "@/utils";

interface SpeechBubbleProps {
  children: React.ReactNode;
  className?: string;
}

export function SpeechBubble({ children, className }: SpeechBubbleProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-strong)] px-4 py-2.5 text-sm text-ink backdrop-blur-[var(--glass-blur)]">
        {children}
      </div>
      {/* Tail */}
      <div
        className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r border-[var(--glass-border)] bg-[var(--glass-strong)]"
        aria-hidden="true"
      />
    </div>
  );
}
