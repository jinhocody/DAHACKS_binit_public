"use client";

import { levelProgress, MAX_LEVEL } from "@/lib/sorting-config";
import { useShop } from "./outfit-store";

/** "Lvl. N" with a small XP bar (the "4/10" label sits inside it), for the corner of the character box. */
export function LevelBadge({ className = "" }: { className?: string }) {
  const { spendable, spent } = useShop();
  const { level, into, needed, fraction } = levelProgress(spendable + spent);
  const label = needed === null ? "MAX" : `${into}/${needed}`;
  const pct = `${Math.round(fraction * 100)}%`;
  const aria =
    needed === null ? `Level ${level}, max level` : `Level ${level}, ${into} of ${needed} points to level ${level + 1}`;

  return (
    <div role="status" aria-label={aria} className={`pointer-events-none flex flex-col items-end gap-1 ${className}`}>
      <p className="font-pixel-small text-2xl leading-none text-emerald-950" aria-hidden="true">
        Lvl. {level}
        {level === MAX_LEVEL ? " ★" : ""}
      </p>
      <div className="level-bar" aria-hidden="true">
        <span className="level-bar-fill" style={{ width: pct }} />
        <span className="level-bar-label">{label}</span>
        {/* Same label in light ink, shown only over the filled part so it reads at any progress. */}
        <span className="level-bar-label level-bar-label-on" style={{ clipPath: `inset(0 calc(100% - ${pct}) 0 0)` }}>
          {label}
        </span>
      </div>
    </div>
  );
}
