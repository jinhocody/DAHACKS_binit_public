// Mascot looks and how each sprite is cut into moving parts.
// The PNGs are 64×64 pixel art scaled to 1024px. All coordinates below are in art pixels (0–64).
// Each look is the same plant drawn with different accessories, so only the leaf/headwear cut differs.

export type MascotLook = "base" | "flower" | "straw" | "gold";

type Point = readonly [x: number, y: number];

export interface LookConfig {
  label: string;
  src: string;
  /**
   * Bottom edge of the "top" part (leaf plus any headwear), from left (x=24) to right (x=64).
   * Steps let hat brims that hang lower on the right stay with the top part.
   */
  topEdge: readonly Point[];
  /** Where the top part rotates from (stem base or hat center). */
  topPivot: Point;
  /** How far the top part sways at idle, in degrees. Headwear sways less than a bare leaf. */
  topSway: number;
}

const ART_SIZE = 64;

/** The watering-can arm is the same region on every look: left of column 24, above row 35. */
export const ARM_BOX = { right: 24, bottom: 35 } as const;
/** Shoulder joint the arm rotates around. */
export const ARM_PIVOT: Point = [23, 33];
/** Bottom-center of the pot, used for squash and stretch. */
export const BASE_PIVOT: Point = [31, 54];
/** Where the spout ends up when the can is tipped for watering (art pixels, after the -60° tip). */
export const SPOUT: Point = [4, 34];

export const LOOKS: Record<MascotLook, LookConfig> = {
  base: {
    label: "Sprout",
    src: "/mascot/base.png",
    topEdge: [
      [24, 23],
      [64, 23],
    ],
    topPivot: [33, 23],
    topSway: 7,
  },
  flower: {
    label: "Flower crown",
    src: "/mascot/flower.png",
    topEdge: [
      [24, 24],
      [40, 24],
      [40, 25],
      [42, 25],
      [42, 27],
      [64, 27],
    ],
    topPivot: [34, 24],
    topSway: 4,
  },
  straw: {
    label: "Straw hat",
    src: "/mascot/straw.png",
    topEdge: [
      [24, 24],
      [35, 24],
      [35, 25],
      [38, 25],
      [38, 26],
      [41, 26],
      [41, 27],
      [64, 27],
    ],
    topPivot: [34, 24],
    topSway: 4,
  },
  gold: {
    label: "Gold crown",
    src: "/mascot/gold.png",
    topEdge: [
      [24, 24],
      [37, 24],
      [37, 25],
      [41, 25],
      [41, 27],
      [64, 27],
    ],
    topPivot: [34, 24],
    topSway: 4,
  },
};

const pct = (v: number) => `${(v / ART_SIZE) * 100}%`;
const polygon = (points: readonly Point[]) => `polygon(${points.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ")})`;
export const origin = ([x, y]: Point) => `${pct(x)} ${pct(y)}`;

/** clip-path values for the three stacked layers. At rest they tile the sprite exactly. */
export function partClips(look: LookConfig) {
  const { right, bottom } = ARM_BOX;
  const firstY = look.topEdge[0][1];
  return {
    arm: polygon([
      [0, 0],
      [right, 0],
      [right, bottom],
      [0, bottom],
    ]),
    top: polygon([[right, 0], [ART_SIZE, 0], ...[...look.topEdge].reverse()]),
    body: polygon([
      [0, bottom],
      [right, bottom],
      [right, firstY],
      ...look.topEdge,
      [ART_SIZE, ART_SIZE],
      [0, ART_SIZE],
    ]),
  };
}

export function spoutPosition() {
  return { left: pct(SPOUT[0]), top: pct(SPOUT[1]) };
}
