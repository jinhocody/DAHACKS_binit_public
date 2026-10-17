"use client";

// Live points card for the Rewards page: points to spend (earned minus spent on skins), which can go
// below 0 after wrong-bin penalties, plus how they add up.
import { Card } from "@/components/ui/Card";
import { useShop } from "./outfit-store";

export function PointsSummary() {
  const { spendable, spent } = useShop();
  const earned = spendable + spent;
  const negative = spendable < 0;

  return (
    <Card
      className={`flex items-center justify-between gap-4 text-white ${
        negative ? "bg-linear-to-br from-slate-500 to-slate-700" : "bg-linear-to-br from-emerald-600 to-teal-700"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-white/80">Your points</p>
        <p className="text-4xl font-extrabold tracking-tight" role="status" aria-label={`${spendable} points to spend`}>
          {spendable}
        </p>
        <p className="mt-1 text-xs text-white/80">
          Earned {earned} · Spent {spent} on skins
        </p>
        {negative && (
          <p className="mt-1 text-xs font-semibold">Sort items correctly to get back above 0 and cheer up your plant.</p>
        )}
      </div>
      <span aria-hidden="true" className="text-5xl">
        {negative ? "🌧️" : "🏆"}
      </span>
    </Card>
  );
}
