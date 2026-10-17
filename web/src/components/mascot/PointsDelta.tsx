"use client";

import { useEffect, useState } from "react";
import "./mascot.css";

const COUNT_DELAY_MS = 200;
const COUNT_MS = 700;

/** Big animated "+5" / "−2": pops in, counts up from 0, and a copy floats away. A value of 0 shows `zeroText`. */
export function PointsDelta({ value, total, zeroText }: { value: number; total: number; zeroText?: string }) {
  const target = Math.abs(value);
  // Reduced motion (or nothing to count): start at the final number and skip the count-up.
  const [animate] = useState(
    () => target > 0 && typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [shown, setShown] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const start = performance.now() + COUNT_DELAY_MS;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
      setShown(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, target]);

  const sign = value > 0 ? "+" : "−";
  const tone = value > 0 ? "points-delta-gain" : "points-delta-loss";
  const label = `${value > 0 ? "Plus" : "Minus"} ${target} point${target === 1 ? "" : "s"}. Total ${total}.`;

  return (
    <div className="points-delta" role="status" aria-label={value === 0 ? `${zeroText ?? "No change"}. Total ${total}.` : label}>
      {value === 0 ? (
        <p className="font-pixel-small text-lg text-slate-700">{zeroText ?? "No change"}</p>
      ) : (
        <>
          <p className={`points-delta-value ${tone}`} aria-hidden="true">
            {sign}
            {shown}
          </p>
          <p className={`points-delta-ghost ${tone}`} aria-hidden="true">
            {sign}
            {target}
          </p>
        </>
      )}
      <p className="font-pixel-small mt-1 text-lg text-slate-700" aria-hidden="true">
        Total: {total}
      </p>
    </div>
  );
}
