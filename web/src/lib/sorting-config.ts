// Single source of truth for sorting rules, points and help links.
// Safe to import from client and server. Change values here only.
import { BIN_CATEGORIES, type BinCategory, type WasteCategory } from "./scan-types";

/** When the rules below were last checked against the city guide (see waste_sorting.md, Part 4). */
export const RULES_LAST_CHECKED = "2026-10-16";

export const LOCATION = {
  city: "Cupertino, California",
  hauler: "Recology",
  sources: ["https://www.cupertino.gov/nowaste", "https://www.recology.com/cupertino"],
};

/** Below this confidence a bin result becomes "uncertain" and earns nothing. */
export const MIN_CONFIDENCE = 0.6;

/** Points per result. Special, uncertain and simulated (mock) results always earn 0. */
export const POINTS: Record<WasteCategory, number> = {
  recycling: 5,
  compost: 2,
  trash: 2,
  special: 0,
  uncertain: 0,
};

/**
 * Bin shown for each result; null means "no curbside bin". Named by kind, not color: public and campus
 * bins often aren't color-coded (home carts here are blue / green / gray).
 */
export const BINS: Record<WasteCategory, string | null> = {
  recycling: "Recycling bin",
  compost: "Compost bin",
  trash: "Trash (landfill) bin",
  special: null,
  uncertain: null,
};

export interface HelpLink {
  message: string;
  linkLabel: string;
  url: string;
}

/** Shown for results that have no bin. TODO: verify both URLs before each release. */
export const HELP: Record<Extract<WasteCategory, "special" | "uncertain">, HelpLink> = {
  special: {
    message: "This needs special handling and never goes in a regular bin.",
    linkLabel: "Cupertino household hazardous waste guide",
    url: "https://www.cupertino.gov/hhw",
  },
  uncertain: {
    message: "Not sure where this goes. Look it up before you toss it.",
    linkLabel: "Recology Cupertino \"What Bin\" guide",
    url: "https://www.recology.com/cupertino",
  },
};

/** Anti-cheat: same photo never earns twice, and awards need a short gap between them. */
export const AWARD_COOLDOWN_SECONDS = 10;
export const REMEMBERED_PHOTOS = 50;

/** Verification: points are only given after the bin + item-in-bin photos are checked. */
export const VERIFY_WINDOW_MINUTES = 10; // a scan must be verified within this time
export const VERIFY_MIN_CONFIDENCE = 0.6; // Gemini must be at least this sure the item is in the right bin
export const VERIFY_MAX_ATTEMPTS = 2; // tries per scanned item
export const DAILY_POINT_CAP = 50;
/** Points taken away when the AI is sure the item went in the wrong bin (once per scanned item). */
export const WRONG_BIN_PENALTY = 1;

/** Habits. An "active" day is a day with at least one verified disposal. */
export const INACTIVITY_DAYS = 3; // every this many days without one costs INACTIVITY_PENALTY
export const INACTIVITY_PENALTY = 2;
export const STREAK_DAYS = 7; // this many active days in a row earns STREAK_BONUS
export const STREAK_BONUS = 2;

export function isBinCategory(category: WasteCategory): category is BinCategory {
  return (BIN_CATEGORIES as WasteCategory[]).includes(category);
}

export function pointsFor(category: WasteCategory, source: "gemini" | "mock"): number {
  return source === "mock" ? 0 : POINTS[category];
}

/** Points earned (awards and bonuses minus deductions; skin spending doesn't count) needed for each level. */
export const LEVEL_THRESHOLDS = [0, 10, 20] as const;
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function levelFor(total: number): number {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((min, i) => {
    if (i > 0 && total >= min) level = i + 1;
  });
  return level;
}

export interface LevelProgress {
  level: number;
  /** Points into this level (0 when below 0). */
  into: number;
  /** Points this level spans; null at the max level. */
  needed: number | null;
  /** 0–1 fill for a progress bar (1 at the max level). */
  fraction: number;
}

export function levelProgress(total: number): LevelProgress {
  const level = levelFor(total);
  if (level >= MAX_LEVEL) return { level, into: total - LEVEL_THRESHOLDS[level - 1], needed: null, fraction: 1 };
  const start = LEVEL_THRESHOLDS[level - 1];
  const needed = LEVEL_THRESHOLDS[level] - start;
  const into = Math.max(0, total - start);
  return { level, into, needed, fraction: Math.min(1, into / needed) };
}
