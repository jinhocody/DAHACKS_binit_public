// Mascot looks and how each sprite is cut into moving parts.
// The PNGs are 64×64 pixel art scaled to 1024px. All coordinates below are in art pixels (0–64).
// Each look is the same plant drawn with different accessories, so parts can be mixed across looks:
// the can comes from one PNG, the pot from another, the headwear from a third. The face is always base.

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

/**
 * The watering-can arm is the same region on every look: left of column 24, above row 35,
 * plus the strip left of the pot rim (column 19) down to row 38, where some cans reach.
 * Above row 23, column 23 belongs to the headwear (the flower crown reaches it).
 */
export const ARM_BOX = { right: 24, bottom: 35, rimLeft: 19, cansBottom: 38, crownLeft: 23, crownBottom: 23 } as const;
/**
 * Top edge of the pot, from left to right, checked against all four PNGs.
 * The rim curves up at both sides, so the edge steps down toward the middle.
 */
const POT_EDGE: readonly Point[] = [
  [24, 35],
  [24, 36],
  [25, 36],
  [25, 37],
  [30, 37],
  [30, 38],
  [41, 38],
  [41, 37],
  [42, 37],
  [42, 36],
  [43, 36],
  [43, 35],
];
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

/** Which look each accessory slot is taken from. "base" means no accessory in that slot. */
export interface Outfit {
  can: MascotLook;
  pot: MascotLook;
  head: MascotLook;
}

export const DEFAULT_OUTFIT: Outfit = { can: "base", pot: "base", head: "base" };

export interface Layer {
  src: string;
  clip: string;
}

/**
 * The four stacked layers for an outfit. At rest they tile the sprite exactly:
 * pot (bottom), face (middle, always base), top (leaf + headwear), arm (watering can).
 */
export function outfitLayers(outfit: Outfit) {
  const { right, bottom, rimLeft, cansBottom, crownLeft, crownBottom } = ARM_BOX;
  const head = LOOKS[outfit.head];
  const topEdge = head.topEdge;
  return {
    pot: {
      src: LOOKS[outfit.pot].src,
      clip: polygon([
        [0, cansBottom],
        [rimLeft, cansBottom],
        [rimLeft, bottom],
        ...POT_EDGE,
        [ART_SIZE, bottom],
        [ART_SIZE, ART_SIZE],
        [0, ART_SIZE],
      ]),
    },
    face: {
      src: LOOKS.base.src,
      clip: polygon([...topEdge, [ART_SIZE, bottom], ...[...POT_EDGE].reverse()]),
    },
    top: {
      src: head.src,
      clip: polygon([
        [crownLeft, 0],
        [ART_SIZE, 0],
        ...[...topEdge].reverse(),
        [right, crownBottom],
        [crownLeft, crownBottom],
      ]),
    },
    arm: {
      src: LOOKS[outfit.can].src,
      clip: polygon([
        [0, 0],
        [crownLeft, 0],
        [crownLeft, crownBottom],
        [right, crownBottom],
        [right, bottom],
        [rimLeft, bottom],
        [rimLeft, cansBottom],
        [0, cansBottom],
      ]),
    },
  } satisfies Record<string, Layer>;
}

export function spoutPosition(spout: Point = SPOUT) {
  return { left: pct(spout[0]), top: pct(spout[1]) };
}

/** One arm of a level character: everything inside `outline`, which starts and ends on the image's left or right edge. */
interface ArmRig {
  side: "left" | "right";
  /** Listed top to bottom; the stretch along the image edge closes it. */
  outline: readonly Point[];
  /** Shoulder joint the arm rotates around. */
  pivot: Point;
}

/**
 * How a level's character art is cut into moving parts, like the level-1 plant:
 * a swaying top, an arm holding the watering can, a free arm that waves, and the body that stays put.
 */
export interface LevelRig {
  src: string;
  /** Bottom edge of the top part, from left (x=0) to right (x=64). */
  topEdge: readonly Point[];
  topPivot: Point;
  topSway: number;
  canArm: ArmRig & {
    /** How far the can tips to water (negative = counterclockwise, for a can on the left). */
    tip: number;
    /** Where the spout ends up when tipped. */
    spout: Point;
  };
  freeArm: ArmRig;
}

/**
 * Character art for levels 2 and 3 (level 1 is the layered plant above, with skins).
 * To add one, drop the PNG at `src` in web/public: a square image with a transparent background,
 * 64×64 pixel art scaled up like base.png. Then trace its parts here in art pixels.
 * Until a file exists the level keeps the level-1 plant, so nothing shows as a broken image.
 */
export const LEVEL_RIGS: Record<number, LevelRig> = {
  2: {
    src: "/mascot/level2.png",
    topEdge: [
      [0, 24],
      [36, 24],
      [36, 26],
      [64, 26],
    ],
    topPivot: [32, 24],
    topSway: 4,
    canArm: {
      side: "left",
      outline: [
        [0, 33],
        [22, 33],
        [22, 36],
        [20, 36],
        [20, 50],
        [0, 50],
      ],
      pivot: [22, 34],
      tip: -40,
      spout: [12, 50],
    },
    freeArm: {
      side: "right",
      outline: [
        [64, 27],
        [44, 27],
        [44, 37],
        [64, 37],
      ],
      pivot: [43, 36],
    },
  },
  3: {
    src: "/mascot/level3.png",
    topEdge: [
      [0, 26],
      [12, 26],
      [12, 32],
      [21, 32],
      [21, 30],
      [43, 30],
      [43, 32],
      [64, 32],
    ],
    topPivot: [32, 30],
    topSway: 4,
    canArm: {
      side: "right",
      outline: [
        [64, 38],
        [45, 38],
        [45, 53],
        [64, 53],
      ],
      pivot: [45, 40],
      tip: 40,
      spout: [54, 54],
    },
    freeArm: {
      side: "left",
      outline: [
        [0, 26],
        [12, 26],
        [12, 32],
        [19, 32],
        [19, 48],
        [0, 48],
      ],
      pivot: [19, 40],
    },
  },
};

export const LEVEL_ART: Record<number, string> = Object.fromEntries(
  Object.entries(LEVEL_RIGS).map(([level, rig]) => [level, rig.src]),
);

/** Clip polygons for a level character's four layers. At rest they tile the image exactly. */
export function levelLayers(rig: LevelRig) {
  const arms = [rig.canArm, rig.freeArm];
  const right = arms.find((a) => a.side === "right")?.outline ?? [];
  const left = arms.find((a) => a.side === "left")?.outline ?? [];
  return {
    body: polygon([...rig.topEdge, ...right, [ART_SIZE, ART_SIZE], [0, ART_SIZE], ...[...left].reverse()]),
    top: polygon([[0, 0], [ART_SIZE, 0], ...[...rig.topEdge].reverse()]),
    canArm: polygon(rig.canArm.outline),
    freeArm: polygon(rig.freeArm.outline),
  };
}
