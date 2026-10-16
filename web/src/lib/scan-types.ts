// Shared contract between the website UI and the scanning feature.
export type WasteCategory = "recycling" | "compost" | "landfill" | "hazardous" | "e-waste";

export const WASTE_CATEGORIES: WasteCategory[] = [
  "recycling",
  "compost",
  "landfill",
  "hazardous",
  "e-waste",
];

export interface ScanResult {
  item: string; // "Plastic water bottle"
  material: string; // "PET plastic #1"
  category: WasteCategory;
  bin: string; // "Blue recycling bin"
  prepSteps: string[]; // ["Empty it", "Rinse", "Cap on"]
  confidence: number; // 0–1
  source: "gemini" | "mock";
  note?: string; // caveats, e.g. "rules vary locally"
}

export interface ScanError {
  error: string;
}
