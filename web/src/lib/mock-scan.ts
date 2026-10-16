import type { ScanResult } from "./scan-types";

type CannedItem = Omit<ScanResult, "source" | "note" | "confidence"> & {
  confidence: [number, number];
};

const CANNED_ITEMS: CannedItem[] = [
  {
    item: "Plastic water bottle",
    material: "PET plastic #1",
    category: "recycling",
    bin: "Blue recycling cart",
    prepSteps: ["Empty any liquid", "Give it a quick rinse", "Put the cap back on"],
    confidence: [0.85, 0.97],
  },
  {
    item: "Aluminum soda can",
    material: "Aluminum",
    category: "recycling",
    bin: "Blue recycling cart",
    prepSteps: ["Empty it completely", "Rinse out sticky residue", "Don't crush flat"],
    confidence: [0.88, 0.98],
  },
  {
    item: "Cardboard box",
    material: "Corrugated cardboard",
    category: "recycling",
    bin: "Blue recycling cart",
    prepSteps: ["Remove packing foam and plastic", "Flatten the box", "Keep it dry"],
    confidence: [0.82, 0.95],
  },
  {
    item: "Banana peel",
    material: "Food scraps",
    category: "compost",
    bin: "Green organics cart",
    prepSteps: ["Remove any produce stickers", "Place in green cart or kitchen pail"],
    confidence: [0.86, 0.97],
  },
  {
    item: "AA battery",
    material: "Alkaline battery",
    category: "hazardous",
    bin: "Household hazardous waste drop-off",
    prepSteps: [
      "Never put in curbside carts",
      "Tape the terminals",
      "Take to an HHW drop-off or store collection box",
    ],
    confidence: [0.8, 0.94],
  },
  {
    item: "Chip bag",
    material: "Multi-layer metallized plastic film",
    category: "landfill",
    bin: "Black/gray garbage cart",
    prepSteps: ["Empty out crumbs", "Place in the garbage cart"],
    confidence: [0.7, 0.9],
  },
  {
    // Low confidence on purpose so the "Not sure?" picker can be demoed without a key.
    item: "Plastic-lined paper cup",
    material: "Paper with plastic (PE) lining",
    category: "landfill",
    bin: "Black/gray garbage cart",
    prepSteps: ["Empty any liquid", "Recycle the lid separately if it's rigid plastic"],
    confidence: [0.4, 0.55],
  },
];

/** Returns a plausible random canned result. Purely in-memory; nothing is stored. */
export function getMockScanResult(reason: string): ScanResult {
  const pick = CANNED_ITEMS[Math.floor(Math.random() * CANNED_ITEMS.length)];
  const [lo, hi] = pick.confidence;
  const confidence = Math.round((lo + Math.random() * (hi - lo)) * 100) / 100;
  return {
    item: pick.item,
    material: pick.material,
    category: pick.category,
    bin: pick.bin,
    prepSteps: [...pick.prepSteps],
    confidence,
    source: "mock",
    note: `Simulated result — ${reason}. This is not based on your photo.`,
  };
}
