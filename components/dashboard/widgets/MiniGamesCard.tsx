import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GamesIcon } from "@/components/ui/icons";

export function MiniGamesCard() {
  const games = [
    { name: "Flash Cards", desc: "Topic recall" },
    { name: "Speed Quiz", desc: "Race the clock" },
    { name: "Snake", desc: "Classic grid" },
    { name: "Car Racing", desc: "Dodge traffic" },
    { name: "Basketball", desc: "Drag to shoot" },
    { name: "Hole", desc: "Absorb & grow" },
  ];

  return (
    <Card variant="glass">
      <div className="mb-3 flex items-center gap-2">
        <GamesIcon size={18} className="text-accent" />
        <h3 className="text-sm font-semibold text-ink-strong">Mini Games</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {games.map((game) => (
          <Link key={game.name} href="/dashboard/games">
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-space-700/40 p-3 text-center transition-colors hover:bg-space-700/60">
              <span className="text-xs font-medium text-ink-strong">{game.name}</span>
              <Badge tone="brand">Play</Badge>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
