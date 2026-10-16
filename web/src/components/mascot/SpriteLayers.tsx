import type { CSSProperties } from "react";
import { ARM_PIVOT, LOOKS, origin, outfitLayers, type Layer, type Outfit } from "./looks";

const layerStyle = ({ src, clip }: Layer, extra?: CSSProperties): CSSProperties => ({
  backgroundImage: `url(${src})`,
  clipPath: clip,
  ...extra,
});

/** The mascot's four stacked layers for an outfit. Animation comes from the mascot-* CSS around it. */
export function SpriteLayers({ outfit }: { outfit: Outfit }) {
  const layers = outfitLayers(outfit);
  const head = LOOKS[outfit.head];
  return (
    <>
      <div className="mascot-part" style={layerStyle(layers.pot)} />
      <div className="mascot-part" style={layerStyle(layers.face)} />
      <div
        className="mascot-part mascot-top"
        style={layerStyle(layers.top, {
          transformOrigin: origin(head.topPivot),
          ["--sway" as string]: `${head.topSway}deg`,
        })}
      />
      <div className="mascot-part mascot-arm" style={layerStyle(layers.arm, { transformOrigin: origin(ARM_PIVOT) })} />
    </>
  );
}
