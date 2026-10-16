"use client";

// Temporary per-browser points ledger until the backend owns points.
// Points are only added after /api/verify confirms the item went in the right bin,
// and a confirmed wrong bin takes a small penalty off the total.
// Anti-cheat: each scan earns once, the same photo never earns twice, awards need a short
// cooldown between them, and there's a daily cap.
import { AWARD_COOLDOWN_SECONDS, DAILY_POINT_CAP, REMEMBERED_PHOTOS } from "@/lib/sorting-config";

const STORAGE_KEY = "sortsnap.points.v2";

interface PointsState {
  total: number;
  lastAwardAt: number;
  photoHashes: string[];
  ticketIds: string[];
  penalizedTicketIds: string[];
  day: string; // local YYYY-MM-DD
  dayTotal: number;
}

export interface PenaltyOutcome {
  /** Points actually removed (0 when this scan was already penalized or the total was 0). */
  points: number;
  total: number;
}

export type AwardOutcome =
  | { status: "awarded"; points: number; total: number; capped: boolean }
  | { status: "duplicate" | "used" | "cooldown" | "cap"; total: number };

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load(): PointsState {
  const empty: PointsState = { total: 0, lastAwardAt: 0, photoHashes: [], ticketIds: [], penalizedTicketIds: [], day: today(), dayTotal: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<PointsState> | null;
    if (!parsed || typeof parsed.total !== "number") return empty;
    const sameDay = parsed.day === empty.day;
    return {
      total: parsed.total,
      lastAwardAt: typeof parsed.lastAwardAt === "number" ? parsed.lastAwardAt : 0,
      photoHashes: Array.isArray(parsed.photoHashes) ? parsed.photoHashes : [],
      ticketIds: Array.isArray(parsed.ticketIds) ? parsed.ticketIds : [],
      penalizedTicketIds: Array.isArray(parsed.penalizedTicketIds) ? parsed.penalizedTicketIds : [],
      day: empty.day,
      dayTotal: sameDay && typeof parsed.dayTotal === "number" ? parsed.dayTotal : 0,
    };
  } catch {
    // Storage blocked or corrupt: start fresh.
    return empty;
  }
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

/** SHA-256 of a (resized) photo, used to spot re-used pictures. */
export async function hashPhoto(blob: Blob): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `size-${blob.size}`;
  }
}

/** Adds points for a verified disposal. `photoHashes` = the scan photo plus the verification photos. */
export function awardVerified(points: number, ticketId: string, photoHashes: string[]): AwardOutcome {
  const state = load();
  if (state.ticketIds.includes(ticketId)) return { status: "used", total: state.total };
  if (photoHashes.some((h) => state.photoHashes.includes(h))) return { status: "duplicate", total: state.total };
  const now = Date.now();
  if (now - state.lastAwardAt < AWARD_COOLDOWN_SECONDS * 1000) return { status: "cooldown", total: state.total };
  const allowed = Math.min(points, Math.max(0, DAILY_POINT_CAP - state.dayTotal));
  if (allowed <= 0) return { status: "cap", total: state.total };

  const next: PointsState = {
    ...state,
    total: state.total + allowed,
    dayTotal: state.dayTotal + allowed,
    lastAwardAt: now,
    photoHashes: [...photoHashes, ...state.photoHashes].slice(0, REMEMBERED_PHOTOS),
    ticketIds: [ticketId, ...state.ticketIds].slice(0, REMEMBERED_PHOTOS),
  };
  save(next);
  return { status: "awarded", points: allowed, total: next.total, capped: allowed < points };
}

/** Removes points for a wrong-bin disposal, at most once per scan and never below 0. */
export function deductWrongBin(points: number, ticketId: string): PenaltyOutcome {
  const state = load();
  if (state.penalizedTicketIds.includes(ticketId)) return { points: 0, total: state.total };
  const removed = Math.min(points, state.total);
  const next: PointsState = {
    ...state,
    total: state.total - removed,
    penalizedTicketIds: [ticketId, ...state.penalizedTicketIds].slice(0, REMEMBERED_PHOTOS),
  };
  save(next);
  return { points: removed, total: next.total };
}
