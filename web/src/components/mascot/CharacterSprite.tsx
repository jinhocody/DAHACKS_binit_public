"use client";

import { levelFor } from "@/lib/sorting-config";
import { useLevelArt } from "./level-art";
import type { Outfit } from "./looks";
import { useShop } from "./outfit-store";
import { SpriteLayers } from "./SpriteLayers";

/** Current level from points earned: the ledger total, i.e. spendable plus what was spent on skins. */
export function useLevel(): number {
  const { spendable, spent } = useShop();
  return levelFor(spendable + spent);
}

/**
 * The plant for a level: level 2+ art as one image once it's uploaded (no skins yet), otherwise the
 * layered level-1 plant wearing `outfit`. Returns whether the level art is showing.
 */
export function CharacterSprite({ level, outfit }: { level: number; outfit: Outfit }) {
  const art = useLevelArt(level);
  if (art) return <div className="mascot-part" style={{ backgroundImage: `url(${art})` }} />;
  return <SpriteLayers outfit={outfit} />;
}
