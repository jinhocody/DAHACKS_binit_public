"use client";

// Live in-page camera viewfinder with a shutter button and "hold steady" auto-capture.
// Frames never leave the browser until a capture is handed to onCapture.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toJpeg } from "./resize-image";

const TICK_MS = 250;
const THUMB = 32; // side of the grayscale thumbnail used to detect motion
const MOTION_LIMIT = 6; // mean per-pixel change (0–255) below which the frame counts as steady
const MIN_BRIGHTNESS = 30; // skip near-black frames (lens covered, pocket)
const STEADY_BEFORE_COUNTDOWN = 4; // ~1 s steady before the countdown ring appears
const STEADY_TO_CAPTURE = 10; // ~2.5 s steady in total triggers the capture

type CameraState = "starting" | "live" | "unavailable";

interface LiveCameraProps {
  /** Short instruction shown over the video, e.g. "Hold the item in the frame". */
  guide: string;
  onCapture: (blob: Blob) => void;
  autoCapture?: boolean;
  disabled?: boolean;
  /** Rendered instead of the viewfinder when the camera can't be used. */
  fallback: ReactNode;
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera permission was blocked.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is being used by another app.";
  return "The camera couldn't start.";
}

export function LiveCamera({ guide, onCapture, autoCapture = true, disabled = false, fallback }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("starting");
  const [problem, setProblem] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 0–1 countdown ring
  const capturingRef = useRef(false);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  // Start the back camera; stop every track when unmounted so the camera light turns off.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("No camera API", "NotFoundError");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => undefined); // autoplay may need the muted attribute (set below)
        if (!cancelled) setState("live");
      } catch (err) {
        if (cancelled) return;
        setProblem(cameraErrorMessage(err));
        setState("unavailable");
      }
    }

    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function capture() {
    const video = videoRef.current;
    if (!video || capturingRef.current || !video.videoWidth) return;
    capturingRef.current = true;
    const blob = await toJpeg(video, video.videoWidth, video.videoHeight);
    if (blob && blob.size > 0) {
      onCaptureRef.current(blob);
    } else {
      capturingRef.current = false;
    }
  }

  // Auto-capture once the picture has been steady for a moment.
  useEffect(() => {
    if (state !== "live" || !autoCapture || disabled) return;
    const canvas = document.createElement("canvas");
    canvas.width = THUMB;
    canvas.height = THUMB;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let previous: Float32Array | null = null;
    let steadyTicks = 0;

    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || capturingRef.current) return;
      ctx.drawImage(video, 0, 0, THUMB, THUMB);
      const { data } = ctx.getImageData(0, 0, THUMB, THUMB);
      const gray = new Float32Array(THUMB * THUMB);
      let brightness = 0;
      for (let i = 0; i < gray.length; i++) {
        gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
        brightness += gray[i];
      }
      brightness /= gray.length;

      let motion = Infinity;
      if (previous) {
        motion = 0;
        for (let i = 0; i < gray.length; i++) motion += Math.abs(gray[i] - previous[i]);
        motion /= gray.length;
      }
      previous = gray;

      steadyTicks = motion < MOTION_LIMIT && brightness > MIN_BRIGHTNESS ? steadyTicks + 1 : 0;
      setProgress(
        Math.max(0, (steadyTicks - STEADY_BEFORE_COUNTDOWN) / (STEADY_TO_CAPTURE - STEADY_BEFORE_COUNTDOWN)),
      );
      if (steadyTicks >= STEADY_TO_CAPTURE) capture();
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [state, autoCapture, disabled]);

  if (state === "unavailable") {
    return (
      <div className="flex flex-col gap-3">
        {problem && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            📷 {problem} You can allow camera access in your browser settings and reload.
          </p>
        )}
        {fallback}
      </div>
    );
  }

  const counting = progress > 0;
  const ring = 2 * Math.PI * 28;

  return (
    <div className="relative mx-auto aspect-[3/4] max-h-[65vh] w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        autoPlay
        aria-label="Live camera preview"
      />

      {/* Framing guide */}
      <div className="pointer-events-none absolute inset-[10%] rounded-2xl border-2 border-dashed border-white/70" aria-hidden />
      <p className="absolute inset-x-3 top-3 mx-auto w-fit max-w-full rounded-full bg-black/60 px-3 py-1 text-center text-sm font-medium text-white">
        {guide}
      </p>

      {state === "starting" && (
        <p role="status" className="absolute inset-0 flex items-center justify-center text-sm text-white/90">
          Starting camera…
        </p>
      )}

      {state === "live" && (
        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
          {autoCapture && !disabled && (
            <p className="rounded-full bg-black/60 px-3 py-1 text-xs text-white" role="status">
              {counting ? "Hold still…" : "Hold steady to snap automatically"}
            </p>
          )}
          <button
            type="button"
            onClick={capture}
            disabled={disabled}
            aria-label="Take photo"
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg ring-4 ring-white/40 transition active:scale-95 disabled:opacity-50"
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden>
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#16a34a"
                strokeWidth="5"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-200"
              />
            </svg>
            <span className="h-11 w-11 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  );
}
