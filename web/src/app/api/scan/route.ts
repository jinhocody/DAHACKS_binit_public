import { GeminiScanError, hasGeminiKey, scanWithGemini } from "@/lib/gemini";
import { getMockScanResult } from "@/lib/mock-scan";
import type { ScanError, ScanResult } from "@/lib/scan-types";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

function errorResponse(error: string, status: number) {
  return Response.json({ error } satisfies ScanError, { status });
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

  const image = form.get("image");
  if (!image || typeof image === "string") {
    return errorResponse("Missing 'image' file field.", 400);
  }
  if (!image.type.startsWith("image/") || !ALLOWED_TYPES.has(image.type)) {
    return errorResponse("Unsupported file type. Please upload a JPEG, PNG, WebP or HEIC photo.", 400);
  }
  if (image.size === 0) {
    return errorResponse("The uploaded image is empty.", 400);
  }
  if (image.size > MAX_BYTES) {
    return errorResponse("Image is too large (max 4MB).", 400);
  }

  if (!hasGeminiKey()) {
    console.warn("[api/scan] GEMINI_API_KEY not set — returning mock result");
    return Response.json(getMockScanResult("No API key configured") satisfies ScanResult);
  }

  try {
    const bytes = await image.arrayBuffer();
    const result = await scanWithGemini(bytes, image.type);
    return Response.json(result satisfies ScanResult);
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
