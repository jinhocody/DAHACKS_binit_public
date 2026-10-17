import type { Metadata } from "next";
import { PointsHistory } from "@/components/scan/PointsHistory";

export const metadata: Metadata = {
  title: "History",
  description: "Every point you've earned or lost on Snap.",
};

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Points history</h1>
        <p className="mt-2 max-w-xl text-gray-600">
          Every point you&apos;ve earned or lost on this device: sorted items, wrong bins, streak bonuses and days away.
        </p>
      </header>

      <PointsHistory />
    </div>
  );
}
