"use client";

// Checks once per page load whether a level's character art has been uploaded yet.
import { useSyncExternalStore } from "react";
import { LEVEL_ART } from "./looks";

type Status = "loading" | "ok" | "missing";
const status = new Map<string, Status>();
const listeners = new Set<() => void>();

function probe(src: string) {
  if (status.has(src)) return;
  status.set(src, "loading");
  const img = new Image();
  const done = (s: Status) => {
    status.set(src, s);
    listeners.forEach((l) => l());
  };
  img.onload = () => done(img.naturalWidth > 0 ? "ok" : "missing");
  img.onerror = () => done("missing");
  img.src = src;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The level's character image, or null while it's loading, missing, or for level 1 (the layered plant). */
export function useLevelArt(level: number): string | null {
  const src = LEVEL_ART[level] ?? null;
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!src) return null;
      probe(src);
      return status.get(src) === "ok" ? src : null;
    },
    () => null,
  );
}
