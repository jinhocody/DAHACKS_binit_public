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

/** Bin shown for each result; null means "no curbside bin". */
export const BINS: Record<WasteCategory, string | null> = {
  recycling: "Blue recycling cart",
  compost: "Green organics cart",
  trash: "Gray garbage cart",
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

export function isBinCategory(category: WasteCategory): category is BinCategory {
  return (BIN_CATEGORIES as WasteCategory[]).includes(category);
}

export function pointsFor(category: WasteCategory, source: "gemini" | "mock"): number {
  return source === "mock" ? 0 : POINTS[category];
}
