import type { ScanResult } from "./scan-types";
import { BINS, pointsFor } from "./sorting-config";

type CannedItem = Omit<ScanResult, "source" | "note" | "confidence" | "bin" | "points"> & {
  confidence: [number, number];
};

const CANNED_ITEMS: CannedItem[] = [
  {
    item: "Plastic water bottle",
    material: "PET plastic #1",
    category: "recycling",
    reason: "Clean, empty plastic bottles are recyclable in Cupertino.",
    prepSteps: ["Empty any liquid", "Give it a quick rinse", "Put the cap back on"],
    confidence: [0.85, 0.97],
  },
  {
    item: "Aluminum soda can",
    material: "Aluminum",
    category: "recycling",
    reason: "Aluminum cans are accepted in the recycling bin.",
    prepSteps: ["Empty it completely", "Rinse out sticky residue"],
    confidence: [0.88, 0.98],
  },
  {
    item: "Greasy pizza box",
    material: "Food-soiled cardboard",
    category: "compost",
    reason: "Food-soiled paper goes in the green organics cart.",
    prepSteps: ["Scrape out leftover food", "Tear it to fit the cart"],
    confidence: [0.82, 0.95],
  },
  {
    item: "Banana peel",
    material: "Food scraps",
    category: "compost",
    reason: "Food scraps go in the green organics cart.",
    prepSteps: ["Remove any produce stickers"],
    confidence: [0.86, 0.97],
  },
  {
    item: "AA battery",
    material: "Alkaline battery",
    category: "special",
    reason: "Batteries can start fires and never go in a regular cart.",
    prepSteps: ["Tape the terminals", "Take it to a household hazardous waste drop-off"],
    confidence: [0.8, 0.94],
  },
  {
    item: "Chip bag",
    material: "Multi-layer metallized plastic film",
    category: "trash",
    reason: "Mixed plastic film can't be recycled.",
    prepSteps: ["Empty out crumbs"],
    confidence: [0.7, 0.9],
  },
  {
    // Mixed item, so the "Not sure?" flow can be demoed without a key.
    item: "Coffee cup with plastic lid",
    material: "Paper cup, plastic lid",
    category: "uncertain",
    reason: "The cup and lid go in different carts.",
    prepSteps: ["Separate the lid from the cup", "Cup: green compost cart", "Lid: check the Recology guide"],
    confidence: [0.4, 0.55],
  },
];

/** Returns a plausible random canned result. Purely in-memory; nothing is stored. Never earns points. */
export function getMockScanResult(reason: string): ScanResult {
  const pick = CANNED_ITEMS[Math.floor(Math.random() * CANNED_ITEMS.length)];
  const [lo, hi] = pick.confidence;
  const confidence = Math.round((lo + Math.random() * (hi - lo)) * 100) / 100;
  return {
    item: pick.item,
    material: pick.material,
    category: pick.category,
    bin: BINS[pick.category],
    reason: pick.reason,
    prepSteps: [...pick.prepSteps],
    confidence,
    points: pointsFor(pick.category, "mock"),
    source: "mock",
    note: `Simulated result — ${reason}. This is not based on your photo, so it earns no points.`,
  };
}
