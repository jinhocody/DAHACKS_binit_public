"use client";

import { CharacterSprite } from "./CharacterSprite";
import { HappyMascot } from "./HappyMascot";
import { useLevelArt } from "./level-art";
import { DEFAULT_OUTFIT } from "./looks";
import { useShop } from "./outfit-store";
import { SadMascot } from "./SadMascot";
import "./mascot.css";

const BIG = "min(170px, 44vw)";

/** Level-1 plant blacked out with a "?": the next character before its art is uploaded. */
function MysteryCharacter() {
  return (
    <div className="level-mystery" style={{ ["--size" as string]: BIG }} role="img" aria-label="Mystery character, new look coming soon">
      <div className="level-mystery-shape">
        <CharacterSprite level={1} outfit={DEFAULT_OUTFIT} />
      </div>
      <span className="level-mystery-mark" aria-hidden="true">
        ?
      </span>
    </div>
  );
}

/** Popup hero for a level change: the old character small on the left → the new one big on the right. */
export function LevelChange({ from, to }: { from: number; to: number }) {
  const { equipped } = useShop();
  const up = to > from;
  const nextArt = useLevelArt(to);
  const mystery = up && to > 1 && !nextArt;

  let next;
  if (mystery) next = <MysteryCharacter />;
  else if (up) next = <HappyMascot size={BIG} level={to} />;
  else if (to === 1) next = <SadMascot size={BIG} />;
  else
    next = (
      <div className="level-thumb level-thumb-down" style={{ ["--size" as string]: BIG }}>
        <CharacterSprite level={to} outfit={equipped} />
      </div>
    );

  return (
    <div className="flex w-full items-end justify-center gap-1">
      <figure className="flex flex-col items-center">
        <div className="level-thumb level-thumb-old" style={{ ["--size" as string]: "min(84px, 22vw)" }}>
          <CharacterSprite level={from} outfit={equipped} />
        </div>
        <figcaption className="font-pixel-small text-lg text-slate-600">Lvl. {from}</figcaption>
      </figure>
      <span className="level-arrow font-pixel-small mb-10 text-4xl text-slate-700" aria-hidden="true">
        →
      </span>
      <figure className="level-next flex flex-col items-center">
        {next}
        <figcaption className="flex flex-col items-center leading-none">
          <span className="font-pixel-small text-xl text-slate-900">Lvl. {to}</span>
          {mystery && <span className="font-pixel-small text-base text-slate-600">Coming soon</span>}
        </figcaption>
      </figure>
    </div>
  );
}
