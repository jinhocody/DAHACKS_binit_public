// 16×16 pixel-art icons drawn as crisp SVG rectangles.
// Grid legend: "X" = outline (currentColor), "w" = light fill, "x" = currentColor at half strength, "." = empty.

const ICONS = {
  home: [
    "................",
    ".......XX.......",
    "......XwwX......",
    ".....XwwwwX.....",
    "....XwwwwwwX....",
    "...XwwwwwwwwX...",
    "..XwwwwwwwwwwX..",
    ".XXXXXXXXXXXXXX.",
    "..XwwwwwwwwwwX..",
    "..XwwXXXwwxxwX..",
    "..XwwXwXwwxxwX..",
    "..XwwXwXwwwwwX..",
    "..XwwXwXwwwwwX..",
    "..XwwXwXwwwwwX..",
    "..XXXXXXXXXXXX..",
    "................",
  ],
  camera: [
    "................",
    "................",
    ".....XXXX.......",
    "....XwwwwX......",
    ".XXXXXXXXXXXXXX.",
    ".XwwwwwwwwwwxwX.",
    ".XwwwXXXXXwwwwX.",
    ".XwwXXwwwXXwwwX.",
    ".XwwXwwxwwXwwwX.",
    ".XwwXwxxxwXwwwX.",
    ".XwwXwwxwwXwwwX.",
    ".XwwXXwwwXXwwwX.",
    ".XwwwXXXXXwwwwX.",
    ".XwwwwwwwwwwwwX.",
    ".XXXXXXXXXXXXXX.",
    "................",
  ],
  scan: [
    "XXXXX......XXXXX",
    "XXXXX..X...XXXXX",
    "XX....XXX.....XX",
    "XX.....X......XX",
    "................",
    "....XX....XX....",
    "....X......X....",
    "................",
    ".XXXXXXXXXXXXXX.",
    "................",
    "....X......X....",
    "....XX....XX....",
    "XX............XX",
    "XX............XX",
    "XXXXX......XXXXX",
    "XXXXX......XXXXX",
  ],
  clock: [
    "................",
    ".....XXXXXX.....",
    "....XwwwwwwX....",
    "...XwwwwXwwwX...",
    "..XwwwwwXwwwwX..",
    "..XwwwwwXwwwwX..",
    ".XwwwwwwXwwwwwX.",
    ".XwwwwwwXXXXwwX.",
    ".XwwwwwwwwwwwwX.",
    ".XwwwwwwwwwwwwX.",
    "..XwwwwwwwwwwX..",
    "..XwwwwwwwwwwX..",
    "...XwwwwwwwwX...",
    "....XwwwwwwX....",
    ".....XXXXXX.....",
    "................",
  ],
  trophy: [
    "................",
    "..XXXXXXXXXXXX..",
    "XXXwwwwwwwwwwXXX",
    "XwXwwwwwwwwwwXwX",
    "XwXwwwwxwwwwwXwX",
    ".XXwwwwxwwwwwXX.",
    "..XwwwwxwwwwwX..",
    "...XwwwwwwwwX...",
    "....XXwwwwXX....",
    "......XwwX......",
    "......XwwX......",
    ".....XXwwXX.....",
    "....XXXXXXXX....",
    "....XwwwwwwX....",
    "....XXXXXXXX....",
    "................",
  ],
  sprout: [
    "................",
    "................",
    "..XXX.....XXX...",
    ".XwwwX...XwwwX..",
    ".XwwwwX.XwwwwX..",
    "..XwwwwXwwwwX...",
    "...XXwwXwwXX....",
    ".....XXXXX......",
    ".......X........",
    ".......X........",
    "....XXXXXXX.....",
    "...XxxxxxxxX....",
    "....XxxxxxX.....",
    "....XxxxxxX.....",
    ".....XXXXX......",
    "................",
  ],
  lock: [
    "................",
    "................",
    ".....XXXXXX.....",
    "....XX....XX....",
    "....X......X....",
    "....X......X....",
    "...XXXXXXXXXX...",
    "...XwwwwwwwwX...",
    "...XwwwXXwwwX...",
    "...XwwwXXwwwX...",
    "...XwwwwXwwwX...",
    "...XwwwwXwwwX...",
    "...XwwwwwwwwX...",
    "...XXXXXXXXXX...",
    "................",
    "................",
  ],
  check: [
    "................",
    "................",
    "................",
    ".............XX.",
    "............XXX.",
    "...........XXX..",
    "..........XXX...",
    ".XX......XXX....",
    ".XXX....XXX.....",
    "..XXX..XXX......",
    "...XXXXXX.......",
    "....XXXX........",
    ".....XX.........",
    "................",
    "................",
    "................",
  ],
  rain: [
    "................",
    "......XXXX......",
    ".....XwwwwX.....",
    "...XXwwwwwwXX...",
    "..XwwwwwwwwwwX..",
    ".XwwwwwwwwwwwwX.",
    ".XwwwwwwwwwwwwX.",
    "..XXXXXXXXXXXX..",
    "................",
    "...x...x...x....",
    "..x...x...x.....",
    "................",
    "....x...x...x...",
    "...x...x...x....",
    "................",
    "................",
  ],
} as const;

export type PixelIconName = keyof typeof ICONS;

const LIGHT = "#fffaf0";

/** One path per tone, made of horizontal runs of pixels. */
function paths(rows: readonly string[]) {
  const d: Record<"X" | "w" | "x", string> = { X: "", w: "", x: "" };
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let len = 1;
      while (row[x + len] === c) len++;
      if (c === "X" || c === "w" || c === "x") d[c] += `M${x} ${y}h${len}v1h-${len}z`;
      x += len;
    }
  });
  return d;
}

const PATHS = Object.fromEntries(Object.entries(ICONS).map(([name, rows]) => [name, paths(rows)])) as Record<
  PixelIconName,
  ReturnType<typeof paths>
>;

interface PixelIconProps {
  name: PixelIconName;
  /** Rendered size in px; multiples of 16 stay perfectly crisp. */
  size?: number;
  className?: string;
  /** Accessible name; without it the icon is decorative. */
  title?: string;
  /** Fill for the light pixels; use "transparent" on dark buttons so the button color shows through. */
  light?: string;
}

export function PixelIcon({ name, size = 20, className = "", title, light = LIGHT }: PixelIconProps) {
  const d = PATHS[name];
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={`pixel-icon inline-block shrink-0 ${className}`}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {d.w && light !== "transparent" && <path d={d.w} fill={light} />}
      {d.x && <path d={d.x} fill="currentColor" opacity={0.5} />}
      {d.X && <path d={d.X} fill="currentColor" />}
    </svg>
  );
}
