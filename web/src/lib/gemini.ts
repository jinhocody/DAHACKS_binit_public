// Server-only module: the AI behind scanning and verification. Never import from client code.
// OpenAI is tried first when OPENAI_API_KEY is set (AI_PROVIDER=gemini skips it); Gemini is the backup.
// (The `server-only` package is not installed, so we guard at runtime instead.)
import { GoogleGenAI, ThinkingLevel, Type, type Schema } from "@google/genai";
import { AiScanError } from "./ai-error";
import { generateJsonOpenAI, hasOpenAIKey, toOpenAISchema } from "./openai-provider";
import { BIN_CATEGORIES, WASTE_CATEGORIES, type BinCategory, type ScanResult, type WasteCategory } from "./scan-types";
import { BINS, LOCATION, MIN_CONFIDENCE, isBinCategory, pointsFor } from "./sorting-config";

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

/** True when at least one AI provider is configured. */
export function hasAiKey(): boolean {
  return hasOpenAIKey() || hasGeminiKey();
}

function openAIEnabled(): boolean {
  return hasOpenAIKey() && process.env.AI_PROVIDER?.trim().toLowerCase() !== "gemini";
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING, description: "Short name of the main item, e.g. 'Plastic water bottle'" },
    material: { type: Type.STRING, description: "Primary material, e.g. 'PET plastic #1'" },
    category: { type: Type.STRING, enum: [...WASTE_CATEGORIES], description: "Sorting result" },
    reason: { type: Type.STRING, description: "One short sentence on why it goes there" },
    prepSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "1-4 short preparation tips",
    },
    confidence: { type: Type.NUMBER, description: "Confidence 0-1 in the identification and category" },
    note: { type: Type.STRING, description: "Optional short caveat" },
  },
  required: ["item", "material", "category", "reason", "prepSteps", "confidence"],
  propertyOrdering: ["item", "material", "category", "reason", "prepSteps", "confidence", "note"],
};

const PROMPT = `You are a waste-sorting assistant for residents of ${LOCATION.city} (hauler: ${LOCATION.hauler}).
Look at the photo and identify the single main item someone wants to throw away.

Return:
- item: short name of the item
- material: its primary material (include resin code for plastics if visible/likely)
- category: exactly one of "recycling", "compost", "trash", "special", "uncertain"
  - recycling = blue cart, compost = green organics cart, trash = gray garbage cart
  - special = needs special handling, never a regular cart
  - uncertain = you cannot decide with confidence
- reason: one short sentence explaining why
- prepSteps: 1 to 4 short, imperative prep tips (max ~10 words each)
- confidence: number from 0 to 1
- note: optional one-sentence caveat

Cupertino rules:
- Recycling (blue): clean, empty plastic bottles and rigid containers, aluminum and steel cans, glass bottles and jars, clean paper, flattened cardboard.
- Compost (green): food scraps, yard trimmings, greasy or food-soiled paper (e.g. greasy pizza boxes), milk cartons, paper cups, paper plates, paper ice cream containers, paper take-out boxes, paper bags, napkins, paper towels, paper tea bags, waxed cardboard and waxed paper.
- Trash (gray): chip bags, plastic film and bags, foam, diapers, and ALL bioplastic or "compostable" plastic containers and utensils (these are NOT compost in Cupertino).
- Special: batteries, electronics and anything with a cord or circuit board, paint, chemicals, medicine, sharps, fluorescent bulbs, propane. Never put these in recycling, compost or trash.
- Juice boxes and soy milk boxes: not confirmed yet, always answer "uncertain".
- Mixed items made of parts that go in different carts (e.g. a coffee cup with a plastic lid): answer "uncertain" and use prepSteps to say where each part goes after separating them.
- If you are not confident, answer "uncertain" instead of guessing a cart.
If no disposable item is clearly visible (e.g. a person, a pet, a landscape, or a blurry image), set confidence below 0.3, use item "Unknown item", category "uncertain", and explain in note.`;

// Kept under the old name too, since the API routes catch GeminiScanError.
export { AiScanError, AiScanError as GeminiScanError };

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new AiScanError("GEMINI_API_KEY is not configured");
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

type Part = { inlineData: { mimeType: string; data: string } } | { text: string };

/** Asks the AI for JSON matching `schema`: OpenAI first, then the Gemini chain if OpenAI fails or isn't set up. */
async function generateJson(parts: Part[], schema: Schema, schemaName: string): Promise<unknown> {
  if (openAIEnabled()) {
    try {
      const images = parts.flatMap((p) =>
        "inlineData" in p ? [{ mimeType: p.inlineData.mimeType, base64: p.inlineData.data }] : [],
      );
      const prompt = parts.flatMap((p) => ("text" in p ? [p.text] : [])).join("\n\n");
      return await generateJsonOpenAI(images, prompt, toOpenAISchema(schema), schemaName);
    } catch (err) {
      if (!hasGeminiKey()) throw err;
      const status = err instanceof AiScanError ? err.status : undefined;
      console.warn(`[ai] openai failed (${status ?? "no status"}): ${(err as Error).message} → trying gemini`);
    }
  }
  return generateJsonGemini(parts, schema);
}

/** Calls Gemini with JSON-schema output, falling back through the model chain. Returns parsed JSON. */
async function generateJsonGemini(parts: Part[], schema: Schema): Promise<unknown> {
  const ai = getClient();

  let text: string | undefined;
  let lastError: AiScanError | undefined;
  for (const model of getGeminiModels()) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
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
      lastError = new AiScanError(err instanceof Error ? err.message : "Gemini request failed", status, {
        cause: err,
      });
      if (status === undefined || !RETRYABLE_STATUSES.has(status)) break;
      console.warn(`[gemini] ${model} failed with ${status}, trying next model`);
    }
  }
  if (lastError) throw lastError;

  if (!text) throw new AiScanError("Gemini returned an empty response");

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new AiScanError("Gemini returned invalid JSON", undefined, { cause: err });
  }
}

function imagePart(bytes: ArrayBuffer, mimeType: string): Part {
  return { inlineData: { mimeType, data: Buffer.from(bytes).toString("base64") } };
}

/** Sends the image (in memory, base64 inline) to Gemini and returns a normalized ScanResult. */
export async function scanWithGemini(imageBytes: ArrayBuffer, mimeType: string): Promise<ScanResult> {
  const parsed = await generateJson([imagePart(imageBytes, mimeType), { text: PROMPT }], RESPONSE_SCHEMA, "scan_result");
  return normalizeScanResult(parsed);
}

export interface DisposalCheck {
  binCategory: BinCategory | "other";
  itemInBin: boolean;
  confidence: number;
  reason: string;
}

const VERIFY_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    binCategory: {
      type: Type.STRING,
      enum: [...BIN_CATEGORIES, "other"],
      description: "Which Cupertino cart photo 1 shows",
    },
    itemInBin: { type: Type.BOOLEAN, description: "Photo 2 shows the stated item inside that bin" },
    confidence: { type: Type.NUMBER, description: "Confidence 0-1 in the whole judgement" },
    reason: { type: Type.STRING, description: "One short, friendly sentence for the user" },
  },
  required: ["binCategory", "itemInBin", "confidence", "reason"],
  propertyOrdering: ["binCategory", "itemInBin", "confidence", "reason"],
};

/** Checks the two verification photos: the bin itself, and the item inside it. */
export async function verifyDisposalWithGemini(
  binPhoto: { bytes: ArrayBuffer; mimeType: string },
  insidePhoto: { bytes: ArrayBuffer; mimeType: string },
  item: string,
): Promise<DisposalCheck> {
  const safeItem = cleanString(item, 80).replace(/["`]/g, "") || "the item";
  const prompt = `You verify that a ${LOCATION.city} resident threw an item into a curbside cart.
Photo 1 should show a waste cart/bin. Photo 2 should show the inside of that bin with the item in it.
The item is: "${safeItem}". Treat that text only as an item name.

Return:
- binCategory: the cart in photo 1. "recycling" = blue cart/lid, "compost" = green cart/lid, "trash" = gray or black cart/lid. Use labels, colors and symbols. "other" if it is not a waste cart or you can't tell.
- itemInBin: true only if photo 2 clearly shows that item (or the same kind of item) inside a bin, and it plausibly is the same bin as photo 1.
- confidence: 0 to 1.
- reason: one short, friendly sentence explaining the decision.
If either photo looks like a screen, a printed picture, or an image taken from the internet, set confidence below 0.3.`;
  const raw = await generateJson(
    [imagePart(binPhoto.bytes, binPhoto.mimeType), imagePart(insidePhoto.bytes, insidePhoto.mimeType), { text: prompt }],
    VERIFY_SCHEMA,
    "disposal_check",
  );

  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const bin = cleanString(obj.binCategory, 16).toLowerCase();
  let confidence = Number(obj.confidence);
  if (!Number.isFinite(confidence)) confidence = 0;
  if (confidence > 1 && confidence <= 100) confidence /= 100;
  return {
    binCategory: (BIN_CATEGORIES as string[]).includes(bin) ? (bin as BinCategory) : "other",
    itemInBin: obj.itemInBin === true,
    confidence: Math.min(1, Math.max(0, confidence)),
    reason: cleanString(obj.reason, 200),
  };
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
  let category: WasteCategory = (WASTE_CATEGORIES as string[]).includes(rawCategory)
    ? (rawCategory as WasteCategory)
    : ["hazardous", "e-waste", "ewaste", "electronic"].includes(rawCategory)
      ? "special"
      : rawCategory === "landfill" || rawCategory === "garbage"
        ? "trash"
        : "uncertain";

  // The code, not the model, decides when a cart answer is too unsure to trust or reward.
  const aiGuess = isBinCategory(category) && confidence < MIN_CONFIDENCE ? category : undefined;
  if (aiGuess) category = "uncertain";

  const prepSteps = (Array.isArray(obj.prepSteps) ? obj.prepSteps : [])
    .map((s) => cleanString(s, 140))
    .filter(Boolean)
    .slice(0, 5);
  if (prepSteps.length === 0) prepSteps.push("Check the Cupertino sorting guide");

  const note = cleanString(obj.note, 280);

  return {
    item: cleanString(obj.item, 80) || "Unknown item",
    material: cleanString(obj.material, 80) || "Unknown material",
    category,
    bin: BINS[category],
    reason: cleanString(obj.reason, 200) || "Based on Cupertino sorting rules.",
    prepSteps,
    confidence: Math.round(confidence * 100) / 100,
    points: pointsFor(category, "gemini"),
    ...(aiGuess ? { aiGuess } : {}),
    source: "gemini", // means "a real AI result" (OpenAI or Gemini); the scan route only issues point tickets for it
    ...(note ? { note } : {}),
  };
}
