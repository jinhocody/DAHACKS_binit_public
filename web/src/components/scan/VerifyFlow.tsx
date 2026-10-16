"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { BinCategory, VerifyResult } from "@/lib/scan-types";
import { BINS, DAILY_POINT_CAP, VERIFY_MAX_ATTEMPTS, VERIFY_WINDOW_MINUTES, WRONG_BIN_PENALTY } from "@/lib/sorting-config";
import { awardVerified, deductWrongBin, hashPhoto, type AwardOutcome, type PenaltyOutcome } from "./points-store";
import { resizeImage } from "./resize-image";

type Slot = "bin" | "inside";
type Photo = { blob: Blob; url: string };

const SLOTS: { key: Slot; title: string; hint: string }[] = [
  { key: "bin", title: "1. Photo of the bin", hint: "Show the whole cart so its color is clear" },
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
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputs = { bin: useRef<HTMLInputElement>(null), inside: useRef<HTMLInputElement>(null) };
  const urlsRef = useRef<string[]>([]);

  // Release preview URLs on unmount.
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  async function onPick(slot: Slot, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Please take a photo.");
      return;
    }
    setError(null);
    try {
      const blob = await resizeImage(file);
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      setPhotos((p) => ({ ...p, [slot]: { blob, url } }));
    } catch {
      setError("Couldn't read that photo. Try again.");
    }
  }

  async function submit() {
    if (!photos.bin || !photos.inside) return;
    setStatus("checking");
    setError(null);
    try {
      const body = new FormData();
      body.append("ticket", ticket);
      body.append("binPhoto", photos.bin.blob, "bin.jpg");
      body.append("insidePhoto", photos.inside.blob, "inside.jpg");
      const res = await fetch("/api/verify", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as VerifyResult | null;
      if (!data || typeof data.verified !== "boolean") throw new Error(`Verification failed (HTTP ${res.status}).`);

      if (!data.retryable) setAttempts((n) => n + 1);
      if (data.verified && data.ticketId) {
        const hashes = await Promise.all([hashPhoto(photos.bin.blob), hashPhoto(photos.inside.blob)]);
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

  const checking = status === "checking";
  const canRetry = result && !result.verified && (result.retryable || attempts < VERIFY_MAX_ATTEMPTS);

  return (
    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:p-4">
      <h3 className="font-semibold text-emerald-950">Verify to earn {points} points</h3>
      <p className="mt-0.5 text-xs text-emerald-900">
        Put your {item.toLowerCase()} in the {BINS[category]}, then take both photos within {VERIFY_WINDOW_MINUTES}{" "}
        minutes of scanning. Wrong bin costs {WRONG_BIN_PENALTY} point.
      </p>

      {status !== "done" && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SLOTS.map(({ key, title, hint }) => {
              const photo = photos[key];
              return (
                <div key={key} className="min-w-0">
                  <input
                    ref={inputs[key]}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={(e) => onPick(key, e)}
                    disabled={checking}
                  />
                  <button
                    type="button"
                    onClick={() => inputs[key].current?.click()}
                    disabled={checking}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed border-emerald-300 bg-white p-2 text-center text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                      <img src={photo.url} alt={title} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <>
                        <span className="text-3xl" aria-hidden>
                          📷
                        </span>
                        <span className="text-sm font-semibold">{title}</span>
                        <span className="text-xs text-emerald-800/80">{hint}</span>
                      </>
                    )}
                  </button>
                  {photo && <p className="mt-1 truncate text-center text-xs text-emerald-900">{title} ✓ (tap to retake)</p>}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!photos.bin || !photos.inside || checking}
            className="mt-3 min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Checking your bin…" : "Check my sorting"}
          </button>
        </>
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
