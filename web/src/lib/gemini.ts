// Server-only module: reads GEMINI_API_KEY and calls Gemini. Never import from client code.
// (The `server-only` package is not installed, so we guard at runtime instead.)
import { GoogleGenAI, ThinkingLevel, Type, type Schema } from "@google/genai";
import { WASTE_CATEGORIES, type ScanResult, type WasteCategory } from "./scan-types";

if (typeof window !== "undefined") {
  throw new Error("src/lib/gemini.ts must only be used on the server");
}

// Tried in order; the next one is used when a model is overloaded, rate-limited or retired.
export const DEFAULT_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

// Errors worth retrying on another model: retired (404), rate limit (429), overloaded (5xx), timeout.
const RETRYABLE_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);

export function getGeminiModels(): string[] {
  const override = process.env.GEMINI_MODEL?.trim();
  return override ? [override, ...DEFAULT_GEMINI_MODELS.filter((m) => m !== override)] : DEFAULT_GEMINI_MODELS;
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

const DEFAULT_BINS: Record<WasteCategory, string> = {
  recycling: "Blue recycling cart",
  compost: "Green organics cart",
  landfill: "Black/gray garbage cart",
  hazardous: "Household hazardous waste drop-off",
  "e-waste": "E-waste drop-off / collection event",
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING, description: "Short name of the main item, e.g. 'Plastic water bottle'" },
    material: { type: Type.STRING, description: "Primary material, e.g. 'PET plastic #1'" },
    category: { type: Type.STRING, enum: [...WASTE_CATEGORIES], description: "Disposal category" },
    bin: { type: Type.STRING, description: "Which bin/destination to use, e.g. 'Blue recycling cart'" },
    prepSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-5 short preparation steps",
    },
    confidence: { type: Type.NUMBER, description: "Confidence 0-1 in the identification and category" },
    note: { type: Type.STRING, description: "Optional short caveat, e.g. local rules vary" },
  },
  required: ["item", "material", "category", "bin", "prepSteps", "confidence"],
  propertyOrdering: ["item", "material", "category", "bin", "prepSteps", "confidence", "note"],
};

const PROMPT = `You are a recycling assistant for residents of Santa Clara County, California (USA).
Look at the photo and identify the single main item someone wants to throw away.

Return:
- item: short name of the item
- material: its primary material (include resin code for plastics if visible/likely)
- category: exactly one of "recycling", "compost", "landfill", "hazardous", "e-waste"
- bin: the bin or destination to use (e.g. "Blue recycling cart", "Green organics cart", "Black/gray garbage cart", "Household hazardous waste drop-off", "E-waste drop-off")
- prepSteps: 2 to 5 short, imperative prep steps (max ~10 words each)
- confidence: number from 0 to 1
- note: optional one-sentence caveat

Follow typical California / Santa Clara County curbside rules:
- Clean, empty bottles, cans, jars, cartons, paper and flattened cardboard go in recycling.
- Plastic bags, film, chip bags, foam (polystyrene), greasy/food-soiled paper, and small items under 2 inches usually go in landfill/garbage.
- Food scraps, yard trimmings, and food-soiled paper go in compost/organics where accepted.
- Batteries, paint, chemicals, fluorescent bulbs, sharps, and propane are hazardous — never curbside.
- Electronics, cords, phones, and anything with a circuit board are e-waste.
If no disposable item is clearly visible (e.g. a person, a pet, a landscape, or a blurry image), set confidence below 0.3, use item "Unknown item", category "landfill", and explain in note.`;

export class GeminiScanError extends Error {
  constructor(message: string, public readonly status?: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GeminiScanError";
  }
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiScanError("GEMINI_API_KEY is not configured");
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/** Sends the image (in memory, base64 inline) to Gemini and returns a normalized ScanResult. */
export async function scanWithGemini(imageBytes: ArrayBuffer, mimeType: string): Promise<ScanResult> {
  const ai = getClient();
  const base64 = Buffer.from(imageBytes).toString("base64");

  let text: string | undefined;
  let lastError: GeminiScanError | undefined;
  for (const model of getGeminiModels()) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { mimeType, data: base64 } }, { text: PROMPT }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
          // Sorting trash doesn't need deep reasoning; low thinking keeps scans fast.
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: AbortSignal.timeout(30_000),
        },
      });
      text = response.text;
      lastError = undefined;
      break;
    } catch (err) {
      const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      const status =
        typeof err === "object" && err !== null && "status" in err && typeof err.status === "number"
          ? err.status
          : isTimeout
            ? 408
            : undefined;
      lastError = new GeminiScanError(err instanceof Error ? err.message : "Gemini request failed", status, {
        cause: err,
      });
      if (status === undefined || !RETRYABLE_STATUSES.has(status)) break;
      console.warn(`[gemini] ${model} failed with ${status}, trying next model`);
    }
  }
  if (lastError) throw lastError;

  if (!text) throw new GeminiScanError("Gemini returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new GeminiScanError("Gemini returned invalid JSON", undefined, { cause: err });
  }
  return normalizeScanResult(parsed);
}

function cleanString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

/** Validates and normalizes raw model output into a safe ScanResult. */
export function normalizeScanResult(raw: unknown): ScanResult {
  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  let confidence = typeof obj.confidence === "number" ? obj.confidence : Number(obj.confidence);
  if (!Number.isFinite(confidence)) confidence = 0;
  if (confidence > 1 && confidence <= 100) confidence = confidence / 100; // model answered in percent
  confidence = Math.min(1, Math.max(0, confidence));

  const rawCategory = cleanString(obj.category, 32).toLowerCase().replace(/\s+/g, "-");
  let category: WasteCategory;
  if ((WASTE_CATEGORIES as string[]).includes(rawCategory)) {
    category = rawCategory as WasteCategory;
  } else if (rawCategory === "ewaste" || rawCategory === "electronic") {
    category = "e-waste";
  } else {
    category = "landfill";
    confidence = Math.min(confidence, 0.4);
  }

  const prepSteps = (Array.isArray(obj.prepSteps) ? obj.prepSteps : [])
    .map((s) => cleanString(s, 140))
    .filter(Boolean)
    .slice(0, 5);
  if (prepSteps.length === 0) prepSteps.push("Check your local hauler's guidelines");

  const note = cleanString(obj.note, 280);

  return {
    item: cleanString(obj.item, 80) || "Unknown item",
    material: cleanString(obj.material, 80) || "Unknown material",
    category,
    bin: cleanString(obj.bin, 80) || DEFAULT_BINS[category],
    prepSteps,
    confidence: Math.round(confidence * 100) / 100,
    source: "gemini",
    ...(note ? { note } : {}),
  };
}
