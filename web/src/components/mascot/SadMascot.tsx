import type { CSSProperties } from "react";
import { origin } from "./looks";
import "./mascot.css";

// The sad plant (sad.png, 64×64 art pixels) is cut into three layers like the happy mascot:
// the rain cloud, the drooping leaf, and the body. Coordinates are in art pixels.
type Point = readonly [x: number, y: number];

const SRC = "/mascot/sad.png";
const CLOUD_BOTTOM = 17;

/** Left edge of the leaf, row by row, just right of the head's outline. */
const LEAF_EDGE: readonly Point[] = [
  [38, CLOUD_BOTTOM],
  [38, 24],
  [39, 24],
  [39, 25],
  [40, 25],
  [40, 27],
  [41, 27],
  [41, 28],
  [42, 28],
  [42, 30],
  [44, 30],
  [44, 32],
  [45, 32],
  [45, 33],
];
const LEAF_PIVOT: Point = [38, 21];
const BASE_PIVOT: Point = [32, 54];

const pct = (v: number) => `${(v / 64) * 100}%`;
const polygon = (points: readonly Point[]) => `polygon(${points.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ")})`;

const CLIPS = {
  cloud: polygon([
    [0, 0],
    [64, 0],
    [64, CLOUD_BOTTOM],
    [0, CLOUD_BOTTOM],
  ]),
  leaf: polygon([...LEAF_EDGE, [64, 33], [64, CLOUD_BOTTOM]]),
  body: polygon([[0, CLOUD_BOTTOM], ...LEAF_EDGE, [64, 33], [64, 64], [0, 64]]),
};

// Raindrops under the cloud. `land` is the art-pixel row where each one hits the plant's head or leaf
// (from the sprite's pixel map), or the shoulder beside it, so rain never falls through the face.
const DROPS = [
  { x: 21, land: 34.5, delay: 0.9 },
  { x: 25.5, land: 25, delay: 0 },
  { x: 28, land: 23, delay: 0.55 },
  { x: 30.5, land: 22, delay: 0.2 },
  { x: 33, land: 20, delay: 0.8 },
  { x: 35, land: 19, delay: 0.35 },
  { x: 37.5, land: 18, delay: 0.95 },
  { x: 40, land: 19, delay: 0.1 },
  { x: 42.5, land: 19.5, delay: 0.65 },
  { x: 44.5, land: 22, delay: 1.2 },
  { x: 26.5, land: 24, delay: 1.35 },
  { x: 32, land: 21, delay: 1.55 },
].map((d) => ({ ...d, duration: 0.35 + ((d.land - CLOUD_BOTTOM) / 64) * 2.4 }));

const part = (clip: string, extra?: CSSProperties): CSSProperties => ({
  backgroundImage: `url(${SRC})`,
  clipPath: clip,
  ...extra,
});

/** The sad, rained-on plant. Pure CSS animation; `size` is any CSS length. */
export function SadMascot({ size = "min(420px, 88vw)" }: { size?: string }) {
  return (
    <div className="mascot-sad" style={{ ["--size" as string]: size }} role="img" aria-label="A sad plant under a rain cloud">
      <div className="mascot-sad-puddle" />

      <div className="mascot-sad-sway" style={{ transformOrigin: origin(BASE_PIVOT) }}>
        <div className="mascot-sad-sigh" style={{ transformOrigin: origin(BASE_PIVOT) }}>
          <div className="mascot-sad-shiver">
            <div className="mascot-part" style={part(CLIPS.body)} />
            <div className="mascot-part mascot-sad-leaf" style={part(CLIPS.leaf, { transformOrigin: origin(LEAF_PIVOT) })} />
            <span className="mascot-sad-tear" style={{ left: pct(37), top: pct(32) }} />
            <span className="mascot-sad-tear mascot-sad-tear-late" style={{ left: pct(25), top: pct(31) }} />
          </div>
        </div>
      </div>

      <div className="mascot-sad-cloud">
        <div className="mascot-sad-cloud-bob">
          <div className="mascot-part" style={part(CLIPS.cloud)} />
          {DROPS.map((d, i) => (
            <span
              key={i}
              className="mascot-sad-drop"
              style={{
                left: pct(d.x),
                ["--land" as string]: pct(d.land - 2.3),
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.duration}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
