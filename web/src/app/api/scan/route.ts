import { GeminiScanError, hasGeminiKey, scanWithGemini } from "@/lib/gemini";
import { readImageField } from "@/lib/image-upload";
import { getMockScanResult } from "@/lib/mock-scan";
import { signTicket } from "@/lib/scan-ticket";
import type { ScanError, ScanResult } from "@/lib/scan-types";
import { isBinCategory } from "@/lib/sorting-config";

function errorResponse(error: string, status: number) {
  return Response.json({ error } satisfies ScanError, { status });
}

/** Attaches a signed ticket when the result can earn points after verification. */
function withTicket(result: ScanResult): ScanResult {
  if (result.source !== "gemini" || result.points <= 0 || !isBinCategory(result.category)) return result;
  return {
    ...result,
    ticket: signTicket({ item: result.item, category: result.category, points: result.points }),
  };
}

/**
 * POST /api/scan — multipart/form-data with field `image`.
 * The image is processed in memory only and never stored.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Expected multipart/form-data with an 'image' field.", 400);
  }

  const image = readImageField(form, "image");
  if (typeof image === "string") return errorResponse(image, 400);

  if (!hasGeminiKey()) {
    console.warn("[api/scan] GEMINI_API_KEY not set — returning mock result");
    return Response.json(getMockScanResult("No API key configured") satisfies ScanResult);
  }

  try {
    const bytes = await image.arrayBuffer();
    const result = await scanWithGemini(bytes, image.type);
    return Response.json(withTicket(result) satisfies ScanResult);
  } catch (err) {
    const status = err instanceof GeminiScanError ? err.status : undefined;
    console.error("[api/scan] Gemini scan failed:", status ?? "", err);
    const reason =
      status === 429
        ? "AI service busy (rate limit reached)"
        : status === 401 || status === 403
          ? "AI service rejected the API key"
          : "AI service unavailable";
    return Response.json(getMockScanResult(reason) satisfies ScanResult);
  }
}
