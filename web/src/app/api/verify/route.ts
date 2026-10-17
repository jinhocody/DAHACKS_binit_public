import { GeminiScanError, hasAiKey, verifyDisposalWithGemini } from "@/lib/gemini";
import { readImageField } from "@/lib/image-upload";
import { verifyTicket } from "@/lib/scan-ticket";
import type { VerifyResult } from "@/lib/scan-types";
import { BINS, VERIFY_MIN_CONFIDENCE, WRONG_BIN_PENALTY } from "@/lib/sorting-config";

function reply(result: VerifyResult, status = 200) {
  return Response.json(result satisfies VerifyResult, { status });
}

function fail(reason: string, status = 400, extra: Partial<VerifyResult> = {}) {
  return reply({ verified: false, points: 0, reason, ...extra }, status);
}

/**
 * POST /api/verify — multipart/form-data with `ticket` (from /api/scan), `binPhoto` and `insidePhoto`.
 * The AI (OpenAI, or Gemini as backup) checks that the item went into the right bin; points are only returned when it did,
 * and a clearly wrong bin returns a `penalty` the client deducts.
 * Photos are processed in memory only and never stored.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Expected multipart/form-data.");
  }

  const token = form.get("ticket");
  if (typeof token !== "string" || !token) return fail("Missing scan ticket. Scan the item first.");
  const ticket = verifyTicket(token);
  if (!ticket.ok) return fail(ticket.reason);
  const { data } = ticket;

  const binPhoto = readImageField(form, "binPhoto", "bin photo");
  if (typeof binPhoto === "string") return fail(binPhoto);
  const insidePhoto = readImageField(form, "insidePhoto", "photo of the item in the bin");
  if (typeof insidePhoto === "string") return fail(insidePhoto);

  if (!hasAiKey()) return fail("Verification needs the AI service, which isn't configured.", 503);

  try {
    const check = await verifyDisposalWithGemini(
      { bytes: await binPhoto.arrayBuffer(), mimeType: binPhoto.type },
      { bytes: await insidePhoto.arrayBuffer(), mimeType: insidePhoto.type },
      data.item,
    );
    const base = { ticketId: data.id, detectedBin: check.binCategory };

    if (check.confidence < VERIFY_MIN_CONFIDENCE) {
      return fail(check.reason || "Couldn't tell from these photos. Try clearer ones.", 200, base);
    }
    if (check.binCategory === "other") {
      return fail(`That doesn't look like a sorting cart — this goes in the ${BINS[data.category]}.`, 200, base);
    }
    if (check.binCategory !== data.category) {
      return fail(`That's the ${BINS[check.binCategory]} — this goes in the ${BINS[data.category]}.`, 200, {
        ...base,
        penalty: WRONG_BIN_PENALTY,
      });
    }
    if (!check.itemInBin) {
      return fail(check.reason || `Right bin, but we couldn't see the ${data.item} inside it.`, 200, base);
    }
    return reply({ verified: true, points: data.points, reason: check.reason || "Nice sorting!", ...base });
  } catch (err) {
    const status = err instanceof GeminiScanError ? err.status : undefined;
    console.error("[api/verify] AI verify failed:", status ?? "", err);
    return fail("The AI is busy right now. Please try again in a moment.", 503, { retryable: true, ticketId: data.id });
  }
}
