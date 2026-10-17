"use client";

import { useSyncExternalStore } from "react";
import { getActivityStatus, POINTS_EVENT, type ActivityStatus } from "@/components/scan/points-store";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { INACTIVITY_PENALTY, STREAK_BONUS, STREAK_DAYS } from "@/lib/sorting-config";

// useSyncExternalStore needs the same object back while nothing changed.
let cache: { key: string; status: ActivityStatus } | null = null;
function getSnapshot(): ActivityStatus {
  const status = getActivityStatus();
  const key = JSON.stringify(status);
  if (cache?.key !== key) cache = { key, status };
  return cache.status;
}

function subscribe(listener: () => void) {
  window.addEventListener(POINTS_EVENT, listener);
  window.addEventListener("storage", listener);
  window.addEventListener("focus", listener); // the day may have changed while the tab was in the background
  return () => {
    window.removeEventListener(POINTS_EVENT, listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("focus", listener);
  };
}

/** Home page heads-up: losing points tomorrow, finishing a streak today, or how far the streak is. */
export function ActivityBanner() {
  const status = useSyncExternalStore(subscribe, getSnapshot, () => null);
  if (!status?.started) return null;

  if (status.warnInactive) {
    return (
      <p role="status" className="font-pixel-small flex items-center gap-2 bg-amber-100 px-4 py-2.5 text-lg text-amber-950 shadow-sm">
        <PixelIcon name="clock" size={24} className="text-amber-800" />
        Sort something today or lose {INACTIVITY_PENALTY} points tomorrow.
      </p>
    );
  }
  if (status.warnStreak) {
    return (
      <p role="status" className="font-pixel-small flex items-center gap-2 bg-orange-100 px-4 py-2.5 text-lg text-orange-950 shadow-sm">
        <PixelIcon name="flame" size={24} className="text-orange-600" />
        Sort one item today to finish your {STREAK_DAYS}-day streak: +{STREAK_BONUS} points!
      </p>
    );
  }
  if (status.streak > 0) {
    return (
      <p className="font-pixel-small flex items-center gap-2 bg-white/70 px-4 py-2 text-lg text-emerald-950 shadow-sm">
        <PixelIcon name="flame" size={24} className="text-orange-600" />
        Streak: day {status.streak} of {STREAK_DAYS}
        {status.activeToday ? " · done for today" : ""}
      </p>
    );
  }
  return null;
}
