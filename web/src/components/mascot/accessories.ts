// Accessory catalog for the mascot shop. Change names or the price here only.
import type { MascotLook, Outfit } from "./looks";

export type Slot = keyof Outfit;
export type AccessoryLook = Exclude<MascotLook, "base">;
export type AccessoryId = `${Slot}-${AccessoryLook}`;

/** Points spent to buy one accessory. */
export const ACCESSORY_PRICE = 10;

export interface Accessory {
  id: AccessoryId;
  slot: Slot;
  /** Which mascot PNG this accessory is drawn in. */
  look: AccessoryLook;
  name: string;
}

export const SLOTS: { slot: Slot; label: string }[] = [
  { slot: "can", label: "Watering cans" },
  { slot: "pot", label: "Pots" },
  { slot: "head", label: "Head decorations" },
];

export const ACCESSORIES: Accessory[] = [
  { id: "can-flower", slot: "can", look: "flower", name: "Pearl can" },
  { id: "can-straw", slot: "can", look: "straw", name: "Wooden can" },
  { id: "can-gold", slot: "can", look: "gold", name: "Gold can" },
  { id: "pot-flower", slot: "pot", look: "flower", name: "Pearl pot" },
  { id: "pot-straw", slot: "pot", look: "straw", name: "Wicker basket" },
  { id: "pot-gold", slot: "pot", look: "gold", name: "Gold-trim pot" },
  { id: "head-flower", slot: "head", look: "flower", name: "Flower crown" },
  { id: "head-straw", slot: "head", look: "straw", name: "Straw hat" },
  { id: "head-gold", slot: "head", look: "gold", name: "Gold crown" },
];

export const accessoryId = (slot: Slot, look: AccessoryLook): AccessoryId => `${slot}-${look}`;
