"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HappyMascot } from "./HappyMascot";
import { PointsDelta } from "./PointsDelta";
import { SadMascot } from "./SadMascot";

/** How long a points popup stays up before it closes itself (the caller then goes home). */
export const POPUP_AUTO_CLOSE_MS = 3500;

interface PointsPopupProps {
  mood: "happy" | "sad";
  title: string;
  message: ReactNode;
  /** Signed points change: +5, −2… Ignored when `value` is given. */
  delta?: number;
  total?: number;
  /** Shown instead of the animated ±N (e.g. the new level). */
  value?: ReactNode;
  /** Shown instead of the happy/sad plant (e.g. the old → new character). */
  hero?: ReactNode;
  /** Shown instead of the number when delta is 0. */
  zeroText?: string;
  note?: string;
  buttonLabel?: string;
  /** Called once: by the button, Escape, a backdrop click, or the auto-close timer. */
  onClose: () => void;
}

/** Modal popup for any points change: happy or sad plant, the animated +N / −N, then closes on its own. */
export function PointsPopup({
  mood,
  title,
  message,
  delta = 0,
  total = 0,
  value,
  hero,
  zeroText,
  note,
  buttonLabel = "Go home",
  onClose,
}: PointsPopupProps) {
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const closedRef = useRef(false);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onCloseRef.current();
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const timer = window.setTimeout(() => close(), POPUP_AUTO_CLOSE_MS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  const happy = mood === "happy";
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        className={`mascot-popup flex max-h-full w-full max-w-sm flex-col items-center overflow-y-auto rounded-3xl bg-gradient-to-b p-5 text-center shadow-2xl ${
          happy ? "from-emerald-100 to-white" : "from-slate-100 to-white"
        }`}
      >
        {hero ?? (happy ? <HappyMascot size="min(200px, 55vw)" /> : <SadMascot size="min(200px, 55vw)" />)}
        <h2 id={`${id}-title`} className="mt-2 text-2xl font-bold text-slate-900">
          {title}
        </h2>
        <p id={`${id}-desc`} className="mt-1 text-sm text-slate-600">
          {message}
        </p>
        {value ?? <PointsDelta value={delta} total={total} zeroText={zeroText} />}
        {note && <p className="mt-1 text-xs text-slate-600">{note}</p>}
        <div className="popup-timer" aria-hidden="true">
          <span style={{ ["--duration" as string]: `${POPUP_AUTO_CLOSE_MS}ms` }} />
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className={`mt-3 min-h-12 w-full rounded-xl px-4 py-3 font-semibold text-white transition ${
            happy ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
