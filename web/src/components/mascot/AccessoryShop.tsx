"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { ACCESSORIES, ACCESSORY_PRICE, SLOTS, type Accessory, type Slot } from "./accessories";
import { DEFAULT_OUTFIT } from "./looks";
import { buyAccessory, equipAccessory, unequipSlot, useShop, type ShopSnapshot } from "./outfit-store";
import { SpriteLayers } from "./SpriteLayers";
import { useLevel } from "./CharacterSprite";
import { useLevelArt } from "./level-art";
import "./mascot.css";

/** Zoom each thumbnail onto the part being sold (art-pixel center of that region). */
const THUMB_FOCUS: Record<Slot, string> = {
  can: "25% 38%",
  pot: "50% 70%",
  head: "56% 26%",
};

export function AccessoryShop() {
  const shop = useShop();
  const level = useLevel();
  const levelArt = useLevelArt(level) !== null;
  const [message, setMessage] = useState("");

  function onAction(item: Accessory, state: ItemState) {
    if (state === "buy") {
      if (buyAccessory(item.id)) setMessage(`You got the ${item.name}! Your plant is wearing it now.`);
    } else if (state === "wear") {
      equipAccessory(item.id);
      setMessage(`Wearing the ${item.name}.`);
    } else if (state === "wearing") {
      unequipSlot(item.slot);
      setMessage(`Took off the ${item.name}.`);
    }
  }

  return (
    <section
      aria-labelledby="decorate-heading"
      className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="decorate-heading" className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
            Decorate your plant
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Each accessory costs {ACCESSORY_PRICE} points. Earn points by scanning and sorting items.
          </p>
        </div>
        {shop.spendable < 0 ? (
          <p className="rounded-full bg-slate-200 px-4 py-2 text-sm font-bold text-slate-800">
            <PixelIcon name="rain" size={18} className="-mt-0.5 mr-1 align-middle" />−{-shop.spendable} point{shop.spendable === -1 ? "" : "s"} · earn {-shop.spendable} to cheer up your plant
          </p>
        ) : (
          <p className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">
            <PixelIcon name="sprout" size={18} className="-mt-0.5 mr-1 align-middle" />
            {shop.balance} points to spend
          </p>
        )}
      </div>

      {levelArt && (
        <p className="mt-3 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Skins show on your Lvl. 1 plant. Your Lvl. {level} plant doesn&apos;t wear them yet.
        </p>
      )}

      <p role="status" className="mt-3 min-h-5 text-sm font-medium text-emerald-800">
        {message}
      </p>

      <div className="mt-2 flex flex-col gap-6">
        {SLOTS.map(({ slot, label }) => (
          <div key={slot}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{label}</h3>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
              {ACCESSORIES.filter((a) => a.slot === slot).map((item) => (
                <ShopItem key={item.id} item={item} shop={shop} onAction={onAction} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

type ItemState = "wearing" | "wear" | "buy" | "locked";

function itemState(item: Accessory, shop: ShopSnapshot): ItemState {
  if (shop.equipped[item.slot] === item.look) return "wearing";
  if (shop.owned.includes(item.id)) return "wear";
  return shop.balance >= ACCESSORY_PRICE ? "buy" : "locked";
}

function ShopItem({
  item,
  shop,
  onAction,
}: {
  item: Accessory;
  shop: ShopSnapshot;
  onAction: (item: Accessory, state: ItemState) => void;
}) {
  const state = itemState(item, shop);
  const missing = ACCESSORY_PRICE - shop.spendable; // counts back up from below 0 too
  const button = {
    wearing: { text: "Wearing", icon: "check" as const, className: "bg-emerald-600 text-white hover:bg-emerald-700" },
    wear: { text: "Wear", icon: null, className: "bg-white text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-50" },
    buy: { text: `Buy · ${ACCESSORY_PRICE} pts`, icon: null, className: "bg-amber-400 text-amber-950 hover:bg-amber-300" },
    locked: { text: "Locked", icon: "lock" as const, className: "bg-gray-100 text-gray-500" },
  }[state];

  return (
    <li
      className={`flex flex-col items-center rounded-2xl border p-2 text-center sm:p-3 ${
        state === "wearing" ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-white"
      }`}
    >
      <div
        aria-hidden="true"
        className={`relative aspect-square w-full max-w-28 overflow-hidden rounded-xl bg-emerald-50/60 ${
          state === "locked" ? "opacity-50 grayscale" : ""
        }`}
      >
        <div className="mascot-static absolute inset-0" style={{ transform: "scale(1.9)", transformOrigin: THUMB_FOCUS[item.slot] }}>
          <SpriteLayers outfit={{ ...DEFAULT_OUTFIT, [item.slot]: item.look }} />
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-900 sm:text-sm">{item.name}</p>
      <button
        type="button"
        disabled={state === "locked"}
        onClick={() => onAction(item, state)}
        aria-label={state === "wearing" ? `Take off ${item.name}` : `${button.text}: ${item.name}`}
        className={`mt-2 min-h-11 w-full rounded-xl px-2 text-xs font-bold transition sm:text-sm ${button.className}`}
      >
        {button.icon && <PixelIcon name={button.icon} size={16} light="transparent" className="-mt-0.5 mr-1 align-middle" />}
        {button.text}
      </button>
      {state === "locked" && <p className="mt-1 text-[11px] text-gray-500">{missing} more pts</p>}
    </li>
  );
}
