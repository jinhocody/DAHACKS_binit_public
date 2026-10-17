"use client";

import { PointsPopup } from "./PointsPopup";

interface WrongBinPopupProps {
  /** Points actually removed (0 when this scan was already penalized). */
  removed: number;
  total: number;
  /** Where the item should have gone, e.g. "Recycling bin". */
  correctBin: string;
  onClose: () => void;
}

/** Shown on the scan page when verification says the item went in the wrong bin. */
export function WrongBinPopup({ removed, total, correctBin, onClose }: WrongBinPopupProps) {
  return (
    <PointsPopup
      mood="sad"
      title="Oops, wrong bin!"
      message={
        <>
          This one belongs in the <strong className="text-slate-900">{correctBin}</strong>.
        </>
      }
      delta={-removed}
      total={total}
      zeroText="No points taken this time"
      onClose={onClose}
    />
  );
}
