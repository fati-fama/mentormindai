import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  crossLink?: { href: string; label: string };
}

export function ComingSoon({ title, description, crossLink }: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <Card variant="glass" className="max-w-md text-center">
        <EmptyState
          title={`${title} — Coming Soon`}
          body={description}
          cta={
            crossLink ? (
              <Link href={crossLink.href}>
                <Button variant="gradient">{crossLink.label}</Button>
              </Link>
            ) : undefined
          }
        />
      </Card>
    </div>
  );
}
