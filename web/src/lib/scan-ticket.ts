// Server-only: signs and checks scan tickets so the client can't invent or edit what it scanned.
// A ticket is base64url(JSON) + "." + base64url(HMAC-SHA256).
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { BinCategory } from "./scan-types";
import { VERIFY_WINDOW_MINUTES } from "./sorting-config";

if (typeof window !== "undefined") {
  throw new Error("src/lib/scan-ticket.ts must only be used on the server");
}

export interface TicketData {
  id: string; // unique per scan
  item: string; // item name from the scan
  category: BinCategory; // the bin it should go in
  points: number; // points it's worth once verified
  issuedAt: number; // ms since epoch
}

function getSecret(): string {
  const secret = process.env.SCAN_TICKET_SECRET?.trim();
  if (secret) return secret;
  // Fallback so deploys keep working without the extra env var: a one-way hash of an AI key the server has.
  // The Gemini key comes first so tickets signed before OpenAI was added stay valid.
  const aiKey = process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (aiKey) return createHash("sha256").update(`sortsnap-ticket:${aiKey}`).digest("hex");
  return "sortsnap-dev-only-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function signTicket(data: Omit<TicketData, "id" | "issuedAt">): string {
  const full: TicketData = { ...data, id: randomUUID(), issuedAt: Date.now() };
  const payload = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export type TicketCheck = { ok: true; data: TicketData } | { ok: false; reason: string };

export function verifyTicket(token: string): TicketCheck {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return { ok: false, reason: "Invalid scan ticket." };

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "Invalid scan ticket." };
  }

  let data: TicketData;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TicketData;
  } catch {
    return { ok: false, reason: "Invalid scan ticket." };
  }

  if (Date.now() - data.issuedAt > VERIFY_WINDOW_MINUTES * 60_000) {
    return { ok: false, reason: `Too late: verify within ${VERIFY_WINDOW_MINUTES} minutes of scanning. Scan the item again.` };
  }
  return { ok: true, data };
}
