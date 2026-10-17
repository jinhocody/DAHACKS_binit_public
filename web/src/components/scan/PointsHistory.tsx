"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { PixelIcon, type PixelIconName } from "@/components/pixel/PixelIcon";
import { STREAK_DAYS } from "@/lib/sorting-config";
import { getHistory, POINTS_EVENT, type PointsEvent } from "./points-store";

// useSyncExternalStore needs the same array back while nothing changed.
let cache: { key: string; history: PointsEvent[] } | null = null;
function getSnapshot(): PointsEvent[] {
  const history = getHistory();
  const key = `${history.length}:${history[0]?.id ?? ""}`;
  if (cache?.key !== key) cache = { key, history };
  return cache.history;
}

function subscribe(listener: () => void) {
  window.addEventListener(POINTS_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(POINTS_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function when(at: number): string {
  const date = new Date(at);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

const ROW: Record<Exclude<PointsEvent["kind"], "level">, { icon: PixelIconName; title: (e: PointsEvent) => string; detail: string }> = {
  award: { icon: "check", title: (e) => e.item ?? "Sorted item", detail: "Verified in the right bin" },
  "wrong-bin": { icon: "rain", title: (e) => e.item ?? "Sorted item", detail: "Went in the wrong bin" },
  streak: { icon: "flame", title: () => `${STREAK_DAYS}-day streak bonus`, detail: "Sorted something every day" },
  inactive: { icon: "clock", title: (e) => `Away ${e.days ?? "a few"} days`, detail: "No sorting for a while" },
};

/** Every points change on this device, newest first. Starts empty: nothing is listed that didn't happen. */
export function PointsHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, () => null);
  if (history === null) return null;

  if (history.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <PixelIcon name="clock" size={48} light="#bae6fd" className="text-emerald-900" />
        <p className="text-gray-700">Nothing here yet. Scan an item and put it in the right bin to earn your first points!</p>
        <Button href="/scan">Scan an item</Button>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="divide-y divide-gray-200">
        {history.map((e) => {
          if (e.kind === "level") return null; // popup-only; never stored in history
          const row = ROW[e.kind];
          const gain = e.points > 0;
          return (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <PixelIcon name={row.icon} size={28} className={gain ? "text-emerald-700" : "text-slate-600"} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{row.title(e)}</p>
                <p className="text-xs text-gray-600">
                  {row.detail} · {when(e.at)}
                </p>
                {e.category && (
                  <div className="mt-1">
                    <CategoryBadge category={e.category} />
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className={`font-pixel-small text-3xl ${gain ? "text-emerald-700" : "text-red-700"}`}>
                  {gain ? "+" : "−"}
                  {Math.abs(e.points)}
                </p>
                <p className="text-xs text-gray-600">Total {e.total}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
