"use client";

import { Mascot } from "./Mascot";
import { useShop } from "./outfit-store";
import { SadMascot } from "./SadMascot";

/** Home page plant: the sad rainy plant while spendable points are below 0, otherwise the happy one. */
export function HomeMascot() {
  const { spendable } = useShop();

  if (spendable >= 0) return <Mascot />;

  const needed = -spendable;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
      <SadMascot />
      <p className="max-w-xs rounded-2xl bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm" role="status">
        Your plant is sad… wrong bins left you at {spendable} point{spendable === -1 ? "" : "s"}. Sort{" "}
        {needed === 1 ? "an item" : "items"} correctly to earn {needed} point{needed === 1 ? "" : "s"} back and cheer it up.
      </p>
    </div>
  );
}
