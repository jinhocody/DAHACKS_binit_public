"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BinCategory, VerifyResult } from "@/lib/scan-types";
import { BINS, DAILY_POINT_CAP, VERIFY_MAX_ATTEMPTS, VERIFY_WINDOW_MINUTES, WRONG_BIN_PENALTY } from "@/lib/sorting-config";
import { awardVerified, deductWrongBin, hashPhoto, type AwardOutcome, type PenaltyOutcome } from "./points-store";
import { LiveCamera } from "./LiveCamera";
import { WrongBinPopup } from "@/components/mascot/WrongBinPopup";
import { ScanningOverlay } from "./ScanningOverlay";

type Slot = "bin" | "inside";

/** When verification fails and no tries are left, show the result this long, then go back to the home page. */
const HOME_REDIRECT_MS = 3000;
type Photo = { blob: Blob; url: string };

const SLOTS: { key: Slot; title: string; hint: string }[] = [
  { key: "bin", title: "1. Photo of the bin", hint: "Show the whole bin and its label or sign" },
  { key: "inside", title: "2. Item inside the bin", hint: "Open the lid and show your item in it" },
];

const AWARD_MESSAGES: Record<Exclude<AwardOutcome["status"], "awarded">, string> = {
  used: "This scan was already verified — no extra points.",
  duplicate: "These photos were already used — no extra points.",
  cooldown: "Slow down! Wait a few seconds between verifications to earn points.",
  cap: `Daily limit reached (${DAILY_POINT_CAP} points). Come back tomorrow!`,
};

interface VerifyFlowProps {
  ticket: string;
  item: string;
  category: BinCategory;
  points: number;
  /** Hash of the original scan photo, so the same picture can't earn twice. */
  scanPhotoHash: string | null;
}

export function VerifyFlow({ ticket, item, category, points, scanPhotoHash }: VerifyFlowProps) {
  const [photos, setPhotos] = useState<Record<Slot, Photo | null>>({ bin: null, inside: null });
  const [status, setStatus] = useState<"idle" | "checking" | "done">("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [award, setAward] = useState<AwardOutcome | null>(null);
  const [penalty, setPenalty] = useState<PenaltyOutcome | null>(null);
  const [sadDismissedFor, setSadDismissedFor] = useState<VerifyResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);
  const router = useRouter();

  // Release preview URLs on unmount.
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // Photos come only from the live camera, so gallery or downloaded pictures can't earn points.
  function setPhoto(slot: Slot, blob: Blob) {
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    const next = { ...photos, [slot]: { blob, url } };
    setPhotos(next);
    setError(null);
    if (next.bin && next.inside) submit(next.bin, next.inside);
  }

  function retake(slot: Slot) {
    setPhotos((p) => ({ ...p, [slot]: null }));
  }

  async function submit(bin: Photo, inside: Photo) {
    setStatus("checking");
    setError(null);
    try {
      const body = new FormData();
      body.append("ticket", ticket);
      body.append("binPhoto", bin.blob, "bin.jpg");
      body.append("insidePhoto", inside.blob, "inside.jpg");
      const res = await fetch("/api/verify", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as VerifyResult | null;
      if (!data || typeof data.verified !== "boolean") throw new Error(`Verification failed (HTTP ${res.status}).`);

      if (!data.retryable) setAttempts((n) => n + 1);
      if (data.verified && data.ticketId) {
        const hashes = await Promise.all([hashPhoto(bin.blob), hashPhoto(inside.blob)]);
        setAward(awardVerified(data.points, data.ticketId, scanPhotoHash ? [scanPhotoHash, ...hashes] : hashes));
      }
      setPenalty(data.penalty && data.ticketId ? deductWrongBin(data.penalty, data.ticketId) : null);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof TypeError ? "Network error — check your connection." : (err as Error).message);
      setStatus("idle");
    }
  }

  function retry() {
    setPhotos({ bin: null, inside: null });
    setResult(null);
    setStatus("idle");
  }

  // Wrong bin: points were deducted, so this attempt ends; closing the sad-mascot popup goes home.
  const wrongBin = Boolean(result?.penalty);
  // Any other failed verdict gets one more try; after that, go home. "AI busy" results don't use up tries.
  const outOfTries = Boolean(
    result && !result.verified && !result.retryable && !wrongBin && attempts >= VERIFY_MAX_ATTEMPTS,
  );
  useEffect(() => {
    if (!outOfTries) return;
    const timer = window.setTimeout(() => router.push("/"), HOME_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [outOfTries, router]);

  const checking = status === "checking";
  const nextSlot: Slot | null = !photos.bin ? "bin" : !photos.inside ? "inside" : null;
  const canRetry = result && !result.verified && !wrongBin && (result.retryable || attempts < VERIFY_MAX_ATTEMPTS);

  return (
    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:p-4">
      <h3 className="font-semibold text-emerald-950">Verify to earn {points} points</h3>
      <p className="mt-0.5 text-xs text-emerald-900">
        Put your {item.toLowerCase()} in the {BINS[category]}, then take both photos within {VERIFY_WINDOW_MINUTES}{" "}
        minutes of scanning. Wrong bin costs {WRONG_BIN_PENALTY} point.
      </p>

      {status !== "done" && (
        <>
          <div className="relative mt-3 grid grid-cols-2 gap-2 rounded-xl">
            {SLOTS.map(({ key, title }) => {
              const photo = photos[key];
              return (
                <div
                  key={key}
                  className={`min-w-0 rounded-xl border-2 p-1.5 text-center text-xs ${
                    photo ? "border-emerald-400 bg-white" : key === nextSlot ? "border-emerald-500 bg-emerald-100" : "border-dashed border-emerald-200 bg-white/60"
                  }`}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                    <img src={photo.url} alt={title} className="aspect-[4/3] w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center text-2xl" aria-hidden>
                      📷
                    </div>
                  )}
                  <p className="mt-1 truncate font-semibold text-emerald-950">{title}</p>
                  {photo && !checking && (
                    <button type="button" onClick={() => retake(key)} className="mt-0.5 min-h-8 text-emerald-800 underline">
                      Retake
                    </button>
                  )}
                </div>
              );
            })}
            {checking && <ScanningOverlay label="Checking your bin…" />}
          </div>

          {nextSlot && !checking && (
            <div className="mt-3">
              <LiveCamera
                key={nextSlot}
                guide={SLOTS.find((s) => s.key === nextSlot)!.hint}
                onCapture={(blob) => setPhoto(nextSlot, blob)}
                fallback={
                  <p className="rounded-xl bg-white p-3 text-sm text-emerald-950 ring-1 ring-emerald-200">
                    Verification needs live camera access, so photos from your gallery can&apos;t be used. Open this page
                    on your phone and allow the camera.
                  </p>
                }
              />
            </div>
          )}

          {!nextSlot && !checking && photos.bin && photos.inside && (
            <button
              type="button"
              onClick={() => submit(photos.bin!, photos.inside!)}
              className="mt-3 min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Check my sorting
            </button>
          )}
        </>
      )}

      {penalty && result && !result.verified && sadDismissedFor !== result && (
        <WrongBinPopup
          removed={penalty.points}
          total={penalty.total}
          correctBin={BINS[category] ?? "right bin"}
          onClose={() => {
            setSadDismissedFor(result);
            router.push("/");
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div
          role="status"
          className={`mt-3 rounded-xl p-3 text-sm ${result.verified ? "bg-emerald-100 text-emerald-950" : "bg-red-50 text-red-900"}`}
        >
          <p className="font-semibold">{result.verified ? "✅ Verified!" : "❌ Not verified"}</p>
          <p className="mt-0.5">{result.reason}</p>
          {award &&
            (award.status === "awarded" ? (
              <p className="mt-1 font-semibold">
                🌿 +{award.points} points{award.capped ? " (daily limit reached)" : ""} · Total: {award.total}
              </p>
            ) : (
              <p className="mt-1">
                {AWARD_MESSAGES[award.status]} Total: {award.total}
              </p>
            ))}
          {penalty && (
            <p className="mt-1 font-semibold">
              {penalty.points > 0 ? `🥀 −${penalty.points} point for the wrong bin` : "No extra points taken for this item"} ·
              Total: {penalty.total}
            </p>
          )}
          {wrongBin && <p className="mt-2 text-xs">Close the message to go back to the home page.</p>}
          {outOfTries && <p className="mt-2 text-xs">No tries left — taking you back to the home page…</p>}
          {canRetry && (
            <button
              type="button"
              onClick={retry}
              className="mt-2 min-h-11 rounded-lg bg-white px-3 py-2 font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-100"
            >
              Try again{result.retryable ? "" : ` (${VERIFY_MAX_ATTEMPTS - attempts} left)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
