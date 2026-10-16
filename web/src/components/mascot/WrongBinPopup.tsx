"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SadMascot } from "./SadMascot";

interface WrongBinPopupProps {
  /** Points actually removed (0 when this scan was already penalized). */
  removed: number;
  total: number;
  /** Where the item should have gone, e.g. "Blue recycling cart". */
  correctBin: string;
  onClose: () => void;
}

/** Shown on the scan page when verification says the item went in the wrong bin. */
export function WrongBinPopup({ removed, total, correctBin, onClose }: WrongBinPopupProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wrong-bin-title"
        aria-describedby="wrong-bin-desc"
        className="mascot-popup flex max-h-full w-full max-w-sm flex-col items-center overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-100 to-white p-5 text-center shadow-2xl"
      >
        <SadMascot size="min(220px, 60vw)" />
        <h2 id="wrong-bin-title" className="text-xl font-bold text-slate-900">
          Oops, wrong bin!
        </h2>
        <p id="wrong-bin-desc" className="mt-1 text-sm text-slate-600">
          This one belongs in the <strong className="text-slate-900">{correctBin}</strong>.
        </p>
        <p className="mt-3 rounded-full bg-slate-200 px-4 py-1.5 text-sm font-bold text-slate-800">
          {removed > 0 ? `🌧️ −${removed} point${removed === 1 ? "" : "s"}` : "🌧️ No points taken this time"} · Total: {total}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-4 min-h-12 w-full rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body,
  );
}
