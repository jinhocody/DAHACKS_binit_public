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
  bin: string | null; // "Recycling bin", null for special/uncertain
  reason: string; // why it goes there
  prepSteps: string[]; // ["Empty it", "Rinse", "Cap on"]
  confidence: number; // 0–1
  points: number; // points this scan is worth (0 for special, uncertain and mock results)
  /** The AI's bin guess when the result was downgraded to "uncertain" for low confidence. */
  aiGuess?: BinCategory;
  source: "gemini" | "mock";
  note?: string; // caveats, e.g. "rules vary locally"
  /** Signed proof of this scan, sent back to /api/verify. Only present when the scan can earn points. */
  ticket?: string;
}

/** POST /api/verify (multipart: ticket, binPhoto, insidePhoto) response. */
export interface VerifyResult {
  verified: boolean;
  points: number; // points earned (0 unless verified)
  reason: string; // shown to the user
  /** What Gemini thinks the bin is, when it could tell. */
  detectedBin?: BinCategory | "other";
  /** Unique id of the scan ticket, so the same scan can't earn twice. */
  ticketId?: string;
  /** True when the AI was unavailable, so trying again later may work. */
  retryable?: boolean;
  /** Points to deduct because the item went in the wrong bin. */
  penalty?: number;
}

export interface ScanError {
  error: string;
}
