"use client";

// Per-browser accessory shop: what's owned, what's worn, and how many points were spent.
// Only reads the points ledger (getPointsTotal); spending is tracked here, so earning is untouched.
import { useSyncExternalStore } from "react";
import { getPointsTotal } from "@/components/scan/points-store";
import { ACCESSORIES, ACCESSORY_PRICE, accessoryId, type AccessoryId, type Slot } from "./accessories";
import { DEFAULT_OUTFIT, type MascotLook, type Outfit } from "./looks";

const STORAGE_KEY = "sortsnap:mascot:shop:v1";

interface ShopState {
  owned: AccessoryId[];
  spent: number;
  equipped: Outfit;
}

export interface ShopSnapshot extends ShopState {
  /** Points earned minus points spent, never below 0. */
  balance: number;
  /** Points earned minus points spent. Goes below 0 when wrong-bin penalties eat into points already spent. */
  spendable: number;
}

const VALID_IDS = new Set<string>(ACCESSORIES.map((a) => a.id));
const SERVER_SNAPSHOT: ShopSnapshot = { owned: [], spent: 0, equipped: DEFAULT_OUTFIT, balance: 0, spendable: 0 };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): ShopState {
  try {
    const data = JSON.parse(raw ?? "null") as Partial<ShopState> | null;
    if (!data) throw new Error("empty");
    const owned = (Array.isArray(data.owned) ? data.owned : []).filter((id): id is AccessoryId => VALID_IDS.has(id));
    const spent = typeof data.spent === "number" && data.spent > 0 ? data.spent : 0;
    // Only allow wearing what's owned; anything else falls back to the plain base part.
    const wear = (slot: Slot): MascotLook => {
      const look = data.equipped?.[slot];
      return look && look !== "base" && owned.includes(accessoryId(slot, look)) ? look : "base";
    };
    return { owned, spent, equipped: { can: wear("can"), pot: wear("pot"), head: wear("head") } };
  } catch {
    return { owned: [], spent: 0, equipped: DEFAULT_OUTFIT };
  }
}

function save(state: ShopState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked (private mode etc.): purchases just won't persist.
  }
  listeners.forEach((listener) => listener());
}

// useSyncExternalStore needs the same object back while nothing changed.
let cache: { raw: string | null; total: number; snapshot: ShopSnapshot } | null = null;

function getSnapshot(): ShopSnapshot {
  const raw = readRaw();
  const total = getPointsTotal();
  if (cache && cache.raw === raw && cache.total === total) return cache.snapshot;
  const state = parse(raw);
  const spendable = total - state.spent;
  const snapshot = { ...state, balance: Math.max(0, spendable), spendable };
  cache = { raw, total, snapshot };
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  // The points ledger doesn't announce changes (e.g. a wrong-bin deduction on the scan page), and
  // Next keeps visited pages alive while hidden. Re-check whenever a component (re)subscribes,
  // which also happens when a kept-alive page is shown again.
  const recheck = setTimeout(listener, 0);
  return () => {
    clearTimeout(recheck);
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useShop(): ShopSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

/** Buys and wears an accessory. Returns false if it's already owned or not affordable. */
export function buyAccessory(id: AccessoryId): boolean {
  const item = ACCESSORIES.find((a) => a.id === id);
  const state = parse(readRaw());
  const balance = getPointsTotal() - state.spent;
  if (!item || state.owned.includes(id) || balance < ACCESSORY_PRICE) return false;
  save({
    owned: [...state.owned, id],
    spent: state.spent + ACCESSORY_PRICE,
    equipped: { ...state.equipped, [item.slot]: item.look },
  });
  return true;
}

export function equipAccessory(id: AccessoryId) {
  const item = ACCESSORIES.find((a) => a.id === id);
  const state = parse(readRaw());
  if (!item || !state.owned.includes(id)) return;
  save({ ...state, equipped: { ...state.equipped, [item.slot]: item.look } });
}

export function unequipSlot(slot: Slot) {
  const state = parse(readRaw());
  save({ ...state, equipped: { ...state.equipped, [slot]: "base" } });
}
