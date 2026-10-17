"use client";

import { useState } from "react";

const COLORS = ["#facc15", "#f472b6", "#5bb8e0", "#8ab26c", "#fb923c"];
const PIECES = 60;

interface Piece {
  left: string;
  size: string;
  color: string;
  delay: string;
  duration: string;
  drift: string;
  spin: string;
}

function makePieces(): Piece[] {
  const r = (min: number, max: number) => min + Math.random() * (max - min);
  return Array.from({ length: PIECES }, () => ({
    left: `${r(0, 100)}vw`,
    size: `${Math.round(r(6, 11))}px`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: `${Math.round(r(0, 600))}ms`,
    duration: `${Math.round(r(1600, 2800))}ms`,
    drift: `${Math.round(r(-80, 80))}px`,
    spin: `${Math.round(r(2, 6)) * 90 * (Math.random() < 0.5 ? -1 : 1)}deg`,
  }));
}

/** A one-off burst of square pixel confetti falling over the whole screen. Decorative; never blocks clicks. */
export function Confetti() {
  // Made once, so re-renders don't reshuffle the pieces mid-fall.
  const [pieces] = useState(makePieces);
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ["--drift" as string]: p.drift,
            ["--spin" as string]: p.spin,
          }}
        />
      ))}
    </div>
  );
}
