"use client";

// Temporary per-browser points ledger until the backend owns points.
// Points are only added after /api/verify confirms the item went in the right bin,
// and a confirmed wrong bin takes a small penalty off the total.
// Anti-cheat: each scan earns once, the same photo never earns twice, awards need a short
// cooldown between them, and there's a daily cap.
// Habits: a verified disposal makes the day "active". STREAK_DAYS active days in a row earn a bonus,
// and every INACTIVITY_DAYS days without one cost a penalty (charged when the app is next opened).
import type { WasteCategory } from "@/lib/scan-types";
import {
  AWARD_COOLDOWN_SECONDS,
  DAILY_POINT_CAP,
  INACTIVITY_DAYS,
  INACTIVITY_PENALTY,
  REMEMBERED_PHOTOS,
  STREAK_BONUS,
  STREAK_DAYS,
} from "@/lib/sorting-config";

const STORAGE_KEY = "sortsnap.points.v2";
const HISTORY_LIMIT = 100;

/** Fired on window whenever the ledger changes, so live views (mascot, rewards, popups) can refresh. */
export const POINTS_EVENT = "snap:points";

export type PointsEventKind = "award" | "wrong-bin" | "streak" | "inactive";

/** One line of the points history. `points` is signed: +5 for an award, −2 for being away. */
export interface PointsEvent {
  id: string;
  at: number;
  kind: PointsEventKind;
  points: number;
  /** Total right after this event. */
  total: number;
  item?: string;
  category?: WasteCategory;
  /** Days away, for "inactive" events. */
  days?: number;
}

interface PointsState {
  total: number;
  lastAwardAt: number;
  photoHashes: string[];
  ticketIds: string[];
  penalizedTicketIds: string[];
  day: string; // local YYYY-MM-DD
  dayTotal: number;
  history: PointsEvent[];
  /** Local day of the last verified disposal; null until the first one. */
  lastActiveDay: string | null;
  /** Active days in a row, ending on lastActiveDay (resets to 0 after a streak bonus). */
  streak: number;
  /** Inactivity penalties already charged for the current absence. */
  idleBlocksCharged: number;
  /** Streak and inactivity events that haven't been shown in a popup yet. */
  pendingPopups: PointsEvent[];
}

export interface PenaltyOutcome {
  /** Points actually removed (0 when this scan was already penalized). */
  points: number;
  total: number;
}

export type AwardOutcome =
  | { status: "awarded"; points: number; total: number; capped: boolean }
  | { status: "duplicate" | "used" | "cooldown" | "cap"; total: number };

export interface DisposalInfo {
  item: string;
  category: WasteCategory;
}

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Whole calendar days from day `a` to day `b` (both YYYY-MM-DD). */
function daysBetween(a: string, b: string): number {
  const utc = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);
const events = (v: unknown): PointsEvent[] =>
  Array.isArray(v) ? v.filter((e): e is PointsEvent => typeof e?.id === "string" && typeof e?.points === "number") : [];

function load(now = new Date()): PointsState {
  const day = dayKey(now);
  const empty: PointsState = {
    total: 0,
    lastAwardAt: 0,
    photoHashes: [],
    ticketIds: [],
    penalizedTicketIds: [],
    day,
    dayTotal: 0,
    history: [],
    lastActiveDay: null,
    streak: 0,
    idleBlocksCharged: 0,
    pendingPopups: [],
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<PointsState> | null;
    if (!parsed || typeof parsed.total !== "number") return empty;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    return {
      total: parsed.total,
      lastAwardAt: num(parsed.lastAwardAt),
      photoHashes: strings(parsed.photoHashes),
      ticketIds: strings(parsed.ticketIds),
      penalizedTicketIds: strings(parsed.penalizedTicketIds),
      day,
      dayTotal: parsed.day === day ? num(parsed.dayTotal) : 0,
      history: events(parsed.history),
      lastActiveDay: typeof parsed.lastActiveDay === "string" ? parsed.lastActiveDay : null,
      streak: num(parsed.streak),
      idleBlocksCharged: num(parsed.idleBlocksCharged),
      pendingPopups: events(parsed.pendingPopups),
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
  window.dispatchEvent(new Event(POINTS_EVENT));
}

let eventSeq = 0;
function makeEvent(kind: PointsEventKind, points: number, total: number, at: number, extra?: Partial<PointsEvent>): PointsEvent {
  return { id: `${at.toString(36)}-${(eventSeq++).toString(36)}`, at, kind, points, total, ...extra };
}

function withHistory(state: PointsState, ...added: PointsEvent[]): PointsEvent[] {
  return [...[...added].reverse(), ...state.history].slice(0, HISTORY_LIMIT);
}

export function getPointsTotal(): number {
  return load().total;
}

/** Newest first. */
export function getHistory(): PointsEvent[] {
  return load().history;
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

/**
 * Adds points for a verified disposal. `photoHashes` = the scan photo plus the verification photos.
 * Also marks today active, and pays the streak bonus (queued as a popup) on the STREAK_DAYS-th day in a row.
 */
export function awardVerified(points: number, ticketId: string, photoHashes: string[], info: DisposalInfo): AwardOutcome {
  const nowDate = new Date();
  const state = load(nowDate);
  if (state.ticketIds.includes(ticketId)) return { status: "used", total: state.total };
  if (photoHashes.some((h) => state.photoHashes.includes(h))) return { status: "duplicate", total: state.total };
  const now = nowDate.getTime();
  if (now - state.lastAwardAt < AWARD_COOLDOWN_SECONDS * 1000) return { status: "cooldown", total: state.total };
  const allowed = Math.min(points, Math.max(0, DAILY_POINT_CAP - state.dayTotal));
  if (allowed <= 0) return { status: "cap", total: state.total };

  let total = state.total + allowed;
  const award = makeEvent("award", allowed, total, now, { item: info.item, category: info.category });

  const today = state.day;
  const gap = state.lastActiveDay ? daysBetween(state.lastActiveDay, today) : Infinity;
  let streak = gap === 0 ? state.streak : gap === 1 ? state.streak + 1 : 1;
  const added = [award];
  let pendingPopups = state.pendingPopups;
  if (streak >= STREAK_DAYS) {
    total += STREAK_BONUS;
    const bonus = makeEvent("streak", STREAK_BONUS, total, now, { days: STREAK_DAYS });
    added.push(bonus);
    pendingPopups = [...pendingPopups, bonus];
    streak = 0;
  }

  const next: PointsState = {
    ...state,
    total,
    dayTotal: state.dayTotal + allowed,
    lastAwardAt: now,
    photoHashes: [...photoHashes, ...state.photoHashes].slice(0, REMEMBERED_PHOTOS),
    ticketIds: [ticketId, ...state.ticketIds].slice(0, REMEMBERED_PHOTOS),
    history: withHistory(state, ...added),
    lastActiveDay: today,
    streak,
    idleBlocksCharged: 0,
    pendingPopups,
  };
  save(next);
  return { status: "awarded", points: allowed, total: next.total, capped: allowed < points };
}

/** Removes points for a wrong-bin disposal, at most once per scan. The total can go below 0. */
export function deductWrongBin(points: number, ticketId: string, info: DisposalInfo): PenaltyOutcome {
  const state = load();
  if (state.penalizedTicketIds.includes(ticketId)) return { points: 0, total: state.total };
  const removed = points;
  const total = state.total - removed;
  const event = makeEvent("wrong-bin", -removed, total, Date.now(), { item: info.item, category: info.category });
  const next: PointsState = {
    ...state,
    total,
    penalizedTicketIds: [ticketId, ...state.penalizedTicketIds].slice(0, REMEMBERED_PHOTOS),
    history: withHistory(state, event),
  };
  save(next);
  return { points: removed, total: next.total };
}

/** Full days with no verified disposal since the last one (not counting today). */
function idleDays(state: PointsState): number {
  return state.lastActiveDay ? Math.max(0, daysBetween(state.lastActiveDay, state.day) - 1) : 0;
}

/**
 * Charges INACTIVITY_PENALTY for every INACTIVITY_DAYS full days without a verified disposal that
 * haven't been charged yet, as one queued popup. New users (no disposal yet) are never charged.
 */
export function checkInactivity(now = new Date()): void {
  const state = load(now);
  const blocks = Math.floor(idleDays(state) / INACTIVITY_DAYS);
  const newBlocks = blocks - state.idleBlocksCharged;
  if (newBlocks <= 0) return;
  const penalty = newBlocks * INACTIVITY_PENALTY;
  const total = state.total - penalty;
  const event = makeEvent("inactive", -penalty, total, now.getTime(), { days: idleDays(state) });
  save({
    ...state,
    total,
    idleBlocksCharged: blocks,
    history: withHistory(state, event),
    pendingPopups: [...state.pendingPopups, event],
  });
}

/** Removes and returns the streak/inactivity events that still need a popup. */
export function takePendingPopups(): PointsEvent[] {
  const state = load();
  if (state.pendingPopups.length === 0) return [];
  save({ ...state, pendingPopups: [] });
  return state.pendingPopups;
}

export interface ActivityStatus {
  /** Active days in a row that still count (0 once the streak is broken). */
  streak: number;
  activeToday: boolean;
  /** No disposal today, and skipping today means losing points tomorrow. */
  warnInactive: boolean;
  /** One more active day (today) finishes the streak. */
  warnStreak: boolean;
  /** Has the user ever verified a disposal? */
  started: boolean;
}

export function getActivityStatus(now = new Date()): ActivityStatus {
  const state = load(now);
  if (!state.lastActiveDay) return { streak: 0, activeToday: false, warnInactive: false, warnStreak: false, started: false };
  const gap = daysBetween(state.lastActiveDay, state.day);
  const activeToday = gap === 0;
  const streak = gap <= 1 ? state.streak : 0;
  return {
    streak,
    activeToday,
    // Tomorrow's idle days would be `gap`; warn when that completes another INACTIVITY_DAYS block.
    warnInactive: !activeToday && gap > 0 && gap % INACTIVITY_DAYS === 0,
    warnStreak: !activeToday && streak === STREAK_DAYS - 1,
    started: true,
  };
}
