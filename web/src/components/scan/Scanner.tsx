"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import type { ScanError, ScanResult } from "@/lib/scan-types";
import { ScanIcon } from "@/components/pixel/ScanIcon";
import { LiveCamera } from "./LiveCamera";
import { resizeImage } from "./resize-image";
import { ScanResultCard } from "./ScanResultCard";
import { ScanningOverlay } from "./ScanningOverlay";
import { hashPhoto } from "./points-store";

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
  const [photoHash, setPhotoHash] = useState<string | null>(null);

  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const previewRef = useRef<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Release the preview object URL on unmount.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  // Next.js keeps this page alive (hidden) after navigating away. Start fresh next time instead of
  // showing the old result, which could also re-trigger the "go back home" redirect.
  useLayoutEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
      setPreviewUrl(null);
      setLastBlob(null);
      setResult(null);
      setError(null);
      setStatus("idle");
    },
    [],
  );

  function setPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreviewUrl(url);
  }

  async function scan(blob: Blob) {
    setStatus("loading");
    setError(null);
    setResult(null);
    setPhotoHash(null);
    try {
      const body = new FormData();
      body.append("image", blob, "photo.jpg");
      const res = await fetch("/api/scan", { method: "POST", body });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !isScanResult(data)) {
        const msg = (data as ScanError | null)?.error;
        throw new Error(msg || `Scan failed (HTTP ${res.status}).`);
      }
      setPhotoHash(await hashPhoto(blob));
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

  async function onCameraCapture(blob: Blob) {
    setPreview(URL.createObjectURL(blob));
    setLastBlob(blob);
    await scan(blob);
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
          <LiveCamera
            guide="Hold the item in the frame"
            onCapture={onCameraCapture}
            fallback={
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-6 text-white shadow-md transition hover:bg-green-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
              >
                <ScanIcon size={48} />
                <span className="text-lg font-bold">Take photo / Upload</span>
                <span className="text-sm text-green-50">Snap the item you want to throw away</span>
              </button>
            }
          />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
          >
            Choose an image from your device
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
            className="mx-auto max-h-80 w-full object-contain"
          />
          {loading && <ScanningOverlay label="Scanning your item…" />}
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

      {status === "done" && result && <ScanResultCard key={scanId} result={result} photoHash={photoHash} />}

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
