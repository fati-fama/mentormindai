"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { Badge } from "@/components/ui/Badge";
import { NAV_ITEMS } from "./navConfig";

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-brand/15 text-ink-strong"
                : item.status === "soon"
                  ? "text-ink-faint cursor-default"
                  : "text-ink-muted hover:bg-space-700/40 hover:text-ink",
            )}
          >
            {/* Active indicator bar */}
            {isActive && (
              <div
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                style={{ background: "var(--grad-brand)" }}
              />
            )}
            <span className={cn("flex h-5 w-5 items-center justify-center", isActive && "text-brand")}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.status === "soon" && <Badge tone="neutral">Soon</Badge>}
          </Link>
        );
      })}
    </nav>
  );
}
