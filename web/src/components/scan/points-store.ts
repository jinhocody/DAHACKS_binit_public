"use client";

// Temporary per-browser points ledger until the backend owns points.
// Anti-cheat: the same photo never earns twice, and awards need a short cooldown between them.
import { AWARD_COOLDOWN_SECONDS, REMEMBERED_PHOTOS } from "@/lib/sorting-config";

const STORAGE_KEY = "sortsnap.points.v1";

interface PointsState {
  total: number;
  lastAwardAt: number;
  photoHashes: string[];
}

export type AwardOutcome =
  | { status: "awarded"; points: number; total: number }
  | { status: "none" | "duplicate" | "cooldown"; total: number };

function load(): PointsState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<PointsState> | null;
    if (parsed && typeof parsed.total === "number") {
      return {
        total: parsed.total,
        lastAwardAt: typeof parsed.lastAwardAt === "number" ? parsed.lastAwardAt : 0,
        photoHashes: Array.isArray(parsed.photoHashes) ? parsed.photoHashes : [],
      };
    }
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return { total: 0, lastAwardAt: 0, photoHashes: [] };
}

function save(state: PointsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode etc. Points just won't persist.
  }
}

export function getPointsTotal(): number {
  return load().total;
}

/** SHA-256 of the uploaded (resized) photo, used to spot re-scans of the same picture. */
export async function hashPhoto(blob: Blob): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `size-${blob.size}`;
  }
}

export function awardPoints(points: number, photoHash: string): AwardOutcome {
  const state = load();
  if (points <= 0) return { status: "none", total: state.total };
  if (state.photoHashes.includes(photoHash)) return { status: "duplicate", total: state.total };
  const now = Date.now();
  if (now - state.lastAwardAt < AWARD_COOLDOWN_SECONDS * 1000) return { status: "cooldown", total: state.total };

  const next: PointsState = {
    total: state.total + points,
    lastAwardAt: now,
    photoHashes: [photoHash, ...state.photoHashes].slice(0, REMEMBERED_PHOTOS),
  };
  save(next);
  return { status: "awarded", points, total: next.total };
}
