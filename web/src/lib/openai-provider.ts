// Server-only module: reads OPENAI_API_KEY and calls the OpenAI Responses API. Never import from client code.
import OpenAI from "openai";
import { AiScanError } from "./ai-error";

if (typeof window !== "undefined") {
  throw new Error("src/lib/openai-provider.ts must only be used on the server");
}

export const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiScanError("OPENAI_API_KEY is not configured");
  // One quick retry inside the SDK; after that the caller falls back to Gemini.
  if (!client) client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
  return client;
}

/** The subset of the Gemini schema shape our schemas use. */
interface GeminiLikeSchema {
  type?: string;
  description?: string;
  enum?: string[];
  items?: GeminiLikeSchema;
  properties?: Record<string, GeminiLikeSchema>;
  required?: string[];
}

/**
 * Converts one of our Gemini response schemas to an OpenAI strict JSON schema, so each schema is written once.
 * Strict mode needs every property listed in `required` and no extra properties, so fields that were optional
 * become nullable instead (the existing normalizers already treat null like a missing value).
 */
export function toOpenAISchema(schema: GeminiLikeSchema, nullable = false): Record<string, unknown> {
  const type = String(schema.type ?? "string").toLowerCase();
  const out: Record<string, unknown> = { type: nullable ? [type, "null"] : type };
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = nullable ? [...schema.enum, null] : [...schema.enum];
  if (type === "array" && schema.items) out.items = toOpenAISchema(schema.items);
  if (type === "object") {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    out.properties = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, toOpenAISchema(value, !required.has(key))]),
    );
    out.required = Object.keys(properties);
    out.additionalProperties = false;
  }
  return out;
}

export interface ImageInput {
  mimeType: string;
  base64: string;
}

/** Sends the images (in memory, as base64 data URLs) plus the prompt, and returns the parsed JSON answer. */
export async function generateJsonOpenAI(
  images: ImageInput[],
  prompt: string,
  schema: Record<string, unknown>,
  schemaName: string,
): Promise<unknown> {
  const model = getModel();
  let text: string;
  try {
    const response = await getClient().responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            ...images.map((img) => ({
              type: "input_image" as const,
              image_url: `data:${img.mimeType};base64,${img.base64}`,
              detail: "auto" as const,
            })),
            { type: "input_text" as const, text: prompt },
          ],
        },
      ],
      text: { format: { type: "json_schema", name: schemaName, schema, strict: true } },
      // Sorting trash doesn't need deep reasoning; low effort keeps scans fast and cheap.
      reasoning: { effort: "low" },
      store: false,
    });
    const usage = response.usage;
    if (usage) console.info(`[openai] ${model} ${schemaName}: ${usage.input_tokens} in / ${usage.output_tokens} out tokens`);
    text = response.output_text;
  } catch (err) {
    const status =
      err instanceof OpenAI.APIError && typeof err.status === "number"
        ? err.status
        : err instanceof OpenAI.APIConnectionTimeoutError
          ? 408
          : undefined;
    throw new AiScanError(err instanceof Error ? err.message : "OpenAI request failed", status, { cause: err });
  }

  if (!text) throw new AiScanError("OpenAI returned an empty response");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new AiScanError("OpenAI returned invalid JSON", undefined, { cause: err });
  }
}
