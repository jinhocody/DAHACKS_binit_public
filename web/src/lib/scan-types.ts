// Shared contract between the website UI, the scanning feature and the backend.
export type WasteCategory = "recycling" | "compost" | "trash" | "special" | "uncertain";

export const WASTE_CATEGORIES: WasteCategory[] = ["recycling", "compost", "trash", "special", "uncertain"];

/** The three curbside carts. Only these can ever earn points. */
export type BinCategory = Extract<WasteCategory, "recycling" | "compost" | "trash">;
export const BIN_CATEGORIES: BinCategory[] = ["recycling", "compost", "trash"];

export interface ScanResult {
  item: string; // "Plastic water bottle"
  material: string; // "PET plastic #1"
  category: WasteCategory;
  bin: string | null; // "Blue recycling cart", null for special/uncertain
  reason: string; // why it goes there
  prepSteps: string[]; // ["Empty it", "Rinse", "Cap on"]
  confidence: number; // 0–1
  points: number; // points this scan is worth (0 for special, uncertain and mock results)
  /** The AI's bin guess when the result was downgraded to "uncertain" for low confidence. */
  aiGuess?: BinCategory;
  source: "gemini" | "mock";
  note?: string; // caveats, e.g. "rules vary locally"
}

export interface ScanError {
  error: string;
}
