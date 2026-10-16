"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ScanError, ScanResult } from "@/lib/scan-types";
import { resizeImage } from "./resize-image";
import { ScanResultCard } from "./ScanResultCard";
import { awardPoints, hashPhoto, type AwardOutcome } from "./points-store";

type Status = "idle" | "loading" | "done" | "error";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function isScanResult(data: unknown): data is ScanResult {
  return typeof data === "object" && data !== null && "item" in data && "category" in data;
}

export function Scanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState(0);
  const [award, setAward] = useState<AwardOutcome | null>(null);

  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const previewRef = useRef<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Release the preview object URL on unmount.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function setPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreviewUrl(url);
  }

  async function scan(blob: Blob) {
    setStatus("loading");
    setError(null);
    setResult(null);
    setAward(null);
    try {
      const body = new FormData();
      body.append("image", blob, "photo.jpg");
      const res = await fetch("/api/scan", { method: "POST", body });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !isScanResult(data)) {
        const msg = (data as ScanError | null)?.error;
        throw new Error(msg || `Scan failed (HTTP ${res.status}).`);
      }
      setAward(awardPoints(Number(data.points) || 0,await hashPhoto(blob)));
      setResult(data);
      setScanId((n) => n + 1);
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Network error — check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
      );
      setStatus("error");
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setLastBlob(null);
    setResult(null);
    setError(null);

    if (!file.type.startsWith("image/")) {
      setPreview(null);
      setError("That file isn't an image. Please choose a photo.");
      setStatus("error");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setStatus("loading");

    try {
      const blob = await resizeImage(file);

      if (blob.size === 0) {
        setError("That image is empty. Please choose another photo.");
        setStatus("error");
        return;
      }

      if (blob.size > MAX_UPLOAD_BYTES) {
        setError("That image is too large (max 4MB). Try a smaller photo.");
        setStatus("error");
        return;
      }

      setLastBlob(blob);
      await scan(blob);
    } catch {
      setError(
        "Couldn't process this image. Try another photo or a JPEG/PNG file.",
      );
      setStatus("error");
    }
  }

  function reset() {
    setLastBlob(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  }

  const loading = status === "loading";

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Hidden inputs: one with camera capture (mobile), one plain (desktop / gallery) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChange}
        disabled={loading}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChange}
        disabled={loading}
      />

      {status === "idle" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-6 text-white shadow-md transition hover:bg-green-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
          >
            <span className="text-4xl" aria-hidden>
              📷
            </span>
            <span className="text-lg font-bold">Take photo / Upload</span>
            <span className="text-sm text-green-50">Snap the item you want to throw away</span>
          </button>
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
          >
            🖼️ Choose an image from your device
          </button>
          <p className="text-center text-xs text-gray-500">
            Photos are analyzed in memory and never stored.
          </p>
        </div>
      )}

      {previewUrl && (
        <div className="relative w-full overflow-hidden rounded-2xl border border-black/10 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img
            src={previewUrl}
            alt="Photo of the item being scanned"
            className={`mx-auto max-h-80 w-full object-contain transition ${loading ? "opacity-60" : ""}`}
          />
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span
                className="h-12 w-12 animate-spin rounded-full border-4 border-white/70 border-t-green-600"
                aria-hidden
              />
              <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800" role="status">
                Identifying your item…
              </span>
            </div>
          )}
        </div>
      )}

      {!previewUrl && loading && (
        <p role="status" className="text-center text-sm text-gray-600">
          Identifying your item…
        </p>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">Couldn&apos;t scan that</p>
          <p className="mt-1 break-words text-sm">{error}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lastBlob && (
              <button
                type="button"
                onClick={() => scan(lastBlob)}
                className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100"
            >
              Choose another photo
            </button>
          </div>
        </div>
      )}

      {status === "done" && result && <ScanResultCard key={scanId} result={result} award={award} />}

      {status === "done" && (
        <button
          type="button"
          onClick={reset}
          className="min-h-12 w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          Scan another item
        </button>
      )}
    </div>
  );
}
