"use client";

import { BASE_PIVOT, origin } from "./looks";
import { useShop } from "./outfit-store";
import { SpriteLayers } from "./SpriteLayers";
import "./mascot.css";

const HEARTS = [
  { dx: "-140%", delay: "0s" },
  { dx: "120%", delay: "0.8s" },
  { dx: "-40%", delay: "1.6s" },
];

const SPARKLES = [
  { dx: "-260%", dy: "-520%", delay: "0s" },
  { dx: "300%", dy: "-440%", delay: "0.3s" },
  { dx: "-560%", dy: "-80%", delay: "0.55s" },
  { dx: "560%", dy: "-160%", delay: "0.85s" },
  { dx: "-380%", dy: "260%", delay: "1.1s" },
  { dx: "420%", dy: "220%", delay: "1.35s" },
];

/** The plant in its equipped outfit, dancing with hearts and sparkles. Not interactive; `size` is any CSS length. */
export function HappyMascot({ size = "min(420px, 88vw)" }: { size?: string }) {
  const { equipped } = useShop();
  return (
    <div className="mascot-happy" style={{ ["--size" as string]: size }} role="img" aria-label="A happy plant dancing">
      <div className="mascot-shadow" />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="mascot-sparkle"
          style={{ ["--dx" as string]: s.dx, ["--dy" as string]: s.dy, ["--delay" as string]: s.delay }}
        />
      ))}
      <div className="mascot-happy-dancer" style={{ transformOrigin: origin(BASE_PIVOT) }}>
        <div className="mascot-sprite" style={{ transformOrigin: origin(BASE_PIVOT) }}>
          <SpriteLayers outfit={equipped} />
        </div>
      </div>
      {HEARTS.map((h, i) => (
        <svg
          key={i}
          className="mascot-heart"
          style={{ ["--dx" as string]: h.dx, ["--delay" as string]: h.delay }}
          viewBox="0 0 7 6"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <path fill="#f472b6" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" />
          <path fill="#fbcfe8" d="M1 1h1v1H1z" />
        </svg>
      ))}
    </div>
  );
}
