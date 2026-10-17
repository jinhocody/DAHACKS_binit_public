import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PointsSummary } from "@/components/mascot/PointsSummary";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Your SortSnap points: earn them by sorting right. Redeeming rewards is coming soon.",
};

const PERKS = [
  {
    emoji: "⭐",
    title: "Earn points",
    body: "Get points every time you scan an item and sort it into the right bin.",
  },
  {
    emoji: "🔥",
    title: "Keep a streak",
    body: "Sort something every day to build streaks and unlock bonus points.",
  },
  {
    emoji: "🎁",
    title: "Redeem rewards",
    body: "Trade points for perks from local eco-friendly partners.",
  },
];

export default function RewardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Coming soon
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950">Rewards</h1>
        <p className="mt-2 max-w-xl text-gray-600">
          Recycling right should feel good. You earn points for every correctly sorted item and can spend
          them on skins for your plant. Redeeming them for rewards is coming soon.
        </p>
      </header>

      <PointsSummary />

      <ul className="grid gap-4 sm:grid-cols-3">
        {PERKS.map((perk) => (
          <li key={perk.title}>
            <Card className="h-full">
              <span aria-hidden="true" className="text-3xl">
                {perk.emoji}
              </span>
              <h2 className="mt-2 text-lg font-bold text-emerald-950">{perk.title}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">{perk.body}</p>
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex justify-center">
        <Button href="/scan" variant="secondary">
          Start earning — scan an item
        </Button>
      </div>
    </div>
  );
}
