"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkInactivity, POINTS_EVENT, takePendingPopups, type PointsEvent } from "@/components/scan/points-store";
import { STREAK_DAYS } from "@/lib/sorting-config";
import { PointsPopup } from "./PointsPopup";

/**
 * Mounted once in the root layout. Charges the inactivity penalty when the app is opened, and shows the
 * streak / inactivity popups one at a time, then goes home. Waits while on /scan, where the verify
 * popups are shown, so two popups never stack.
 */
export function PointsEvents() {
  const pathname = usePathname();
  const router = useRouter();
  const [queue, setQueue] = useState<PointsEvent[]>([]);
  const paused = pathname.startsWith("/scan");

  useEffect(() => {
    if (paused) return;
    const pull = () => {
      checkInactivity();
      const pending = takePendingPopups();
      if (pending.length) setQueue((q) => [...q, ...pending]);
    };
    pull();
    window.addEventListener(POINTS_EVENT, pull);
    return () => window.removeEventListener(POINTS_EVENT, pull);
  }, [paused]);

  const current = paused ? undefined : queue[0];
  if (!current) return null;

  const close = () => {
    setQueue((q) => q.slice(1));
    if (pathname !== "/") router.push("/");
  };

  return current.kind === "streak" ? (
    <PointsPopup
      key={current.id}
      mood="happy"
      title={`${STREAK_DAYS}-day streak!`}
      message={`You sorted something every day for ${STREAK_DAYS} days. Keep it up!`}
      delta={current.points}
      total={current.total}
      buttonLabel="Yay!"
      onClose={close}
    />
  ) : (
    <PointsPopup
      key={current.id}
      mood="sad"
      title="We missed you…"
      message={`You didn't sort anything for ${current.days ?? "a few"} days. Sort an item today to cheer your plant up.`}
      delta={current.points}
      total={current.total}
      buttonLabel="I'm back"
      onClose={close}
    />
  );
}
