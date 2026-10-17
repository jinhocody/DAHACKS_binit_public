import type { CSSProperties } from "react";
import { levelLayers, origin, type LevelRig } from "./looks";

const layerStyle = (src: string, clip: string, extra?: CSSProperties): CSSProperties => ({
  backgroundImage: `url(${src})`,
  clipPath: clip,
  ...extra,
});

/** A level 2+ character cut into the same moving parts as the level-1 plant. Animation comes from the mascot-* CSS around it. */
export function LevelLayers({ rig }: { rig: LevelRig }) {
  const layers = levelLayers(rig);
  return (
    <>
      <div className="mascot-part" style={layerStyle(rig.src, layers.body)} />
      <div
        className="mascot-part mascot-top"
        style={layerStyle(rig.src, layers.top, {
          transformOrigin: origin(rig.topPivot),
          ["--sway" as string]: `${rig.topSway}deg`,
        })}
      />
      {/* Free arm first so `.mascot-arm-free ~ .mascot-arm` can find the can arm in mascot.css. */}
      <div
        className="mascot-part mascot-arm-free"
        style={layerStyle(rig.src, layers.freeArm, {
          transformOrigin: origin(rig.freeArm.pivot),
          // A positive turn lifts an arm on the left; one on the right lifts the other way.
          ["--wave-dir" as string]: rig.freeArm.side === "left" ? 1 : -1,
        })}
      />
      <div
        className="mascot-part mascot-arm"
        style={layerStyle(rig.src, layers.canArm, {
          transformOrigin: origin(rig.canArm.pivot),
          ["--tip" as string]: `${rig.canArm.tip}deg`,
        })}
      />
    </>
  );
}
