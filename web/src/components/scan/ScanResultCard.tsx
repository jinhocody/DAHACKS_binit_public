"use client";

import { useState } from "react";
import { WASTE_CATEGORIES, type ScanResult, type WasteCategory } from "@/lib/scan-types";
import { CATEGORY_STYLES } from "./categories";

const LOW_CONFIDENCE = 0.6;

export function ScanResultCard({ result }: { result: ScanResult }) {
  const [override, setOverride] = useState<WasteCategory | null>(null);

  const category = override ?? result.category;
  const style = CATEGORY_STYLES[category];
  const bin = override ? CATEGORY_STYLES[override].genericBin : result.bin;
  const pct = Math.round(result.confidence * 100);
  const lowConfidence = result.confidence < LOW_CONFIDENCE;

  return (
    <section
      aria-live="polite"
      className="w-full min-w-0 rounded-2xl border border-black/10 bg-white p-4 text-gray-900 shadow-sm sm:p-6"
    >
      {result.source === "mock" && (
        <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-900 ring-1 ring-yellow-300">
          🧪 Simulated result
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-bold sm:text-2xl">{result.item}</h2>
          <p className="break-words text-sm text-gray-600">{result.material}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${style.pill}`}
        >
          <span aria-hidden>{style.emoji}</span> {style.label}
        </span>
      </div>

      <p className="mt-4 rounded-xl bg-gray-50 p-3 text-base">
        <span className="text-gray-600">Put it in: </span>
        <strong className="break-words">{bin}</strong>
        {override && <span className="block text-xs text-gray-500">(you picked this category)</span>}
      </p>

      {!override && result.prepSteps.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">How to prep it</h3>
          <ol className="mt-2 space-y-2">
            {result.prepSteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${style.accent}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 break-words pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Confidence</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div
          className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Confidence"
        >
          <div
            className={`h-full rounded-full ${lowConfidence ? "bg-amber-500" : style.accent}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {result.note && <p className="mt-4 text-sm italic text-gray-600">{result.note}</p>}

      {lowConfidence && (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="font-semibold text-amber-900">Not sure — is it one of these?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {WASTE_CATEGORIES.map((c) => {
              const s = CATEGORY_STYLES[c];
              const selected = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setOverride(c === result.category ? null : c)}
                  className={`min-h-11 rounded-lg px-2 py-2 text-sm font-medium ring-1 transition ${s.pill} ${
                    selected ? "ring-2 ring-offset-1" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <span aria-hidden>{s.emoji}</span> {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
