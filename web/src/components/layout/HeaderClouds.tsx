// Pixel-art clouds for the header: a bumpy cloud bank along the bottom edge plus a few small
// drifting puffs in the sky. Purely decorative; drawn with crisp SVG rects like PixelIcon.

const PX = 5; // screen pixels per art pixel

/** Column heights (in art pixels) of one repeating stretch of the cloud bank. */
const BANK = [3, 3, 4, 5, 6, 6, 6, 6, 5, 4, 4, 4, 5, 6, 7, 7, 7, 7, 6, 5, 4, 3, 3, 3];
const BANK_H = 10;

/** Fill + outline paths for the cloud bank tile: each column filled up to its height, outlined on top and on steps. */
function bankPaths() {
  let fill = "";
  let line = "";
  BANK.forEach((h, x) => {
    const top = BANK_H - h;
    fill += `M${x} ${top}h1v${h}h-1z`;
    line += `M${x} ${top}h1v1h-1z`;
    // Outline the exposed side of a step down to the lower neighbour.
    for (const n of [BANK[(x + BANK.length - 1) % BANK.length], BANK[(x + 1) % BANK.length]]) {
      if (n < h - 1) line += `M${x} ${top + 1}h1v${h - 1 - n}h-1z`;
    }
  });
  return { fill, line };
}

const PUFF = [
  "....ooo......",
  "..oowwwo.oo..",
  ".owwwwwwowwo.",
  "owwwwwwwwwwwo",
  ".ooooooooooo.",
];

function puffPaths() {
  let fill = "";
  let line = "";
  PUFF.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === "w") fill += `M${x} ${y}h1v1h-1z`;
      if (c === "o") line += `M${x} ${y}h1v1h-1z`;
    });
  });
  return { fill, line };
}

const BANK_D = bankPaths();
const PUFF_D = puffPaths();

function CloudPuff({ className, scale = 3 }: { className: string; scale?: number }) {
  const w = PUFF[0].length;
  const h = PUFF.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      className={`absolute animate-cloud-drift ${className}`}
    >
      <path d={PUFF_D.fill} fill="var(--color-white)" />
      <path d={PUFF_D.line} fill="var(--sky-cloud-line)" />
    </svg>
  );
}

export function HeaderClouds() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <CloudPuff className="top-3 left-[6%]" scale={4} />
      <CloudPuff className="top-4 right-[8%] [animation-delay:-6s]" />
      <CloudPuff className="top-2 left-[44%] hidden [animation-delay:-12s] md:block" />

      <svg className="absolute inset-x-0 bottom-0" width="100%" height={BANK_H * PX} shapeRendering="crispEdges">
        <defs>
          <pattern
            id="header-cloud-bank"
            width={BANK.length * PX}
            height={BANK_H * PX}
            patternUnits="userSpaceOnUse"
          >
            <g transform={`scale(${PX})`}>
              {/* Back row: same bumps shifted half a tile and raised, in a softer tone, for depth. */}
              <g transform={`translate(${BANK.length / 2} -3)`}>
                <path d={BANK_D.fill} fill="var(--sky-cloud-back)" />
                <path d={BANK_D.fill} fill="var(--sky-cloud-back)" transform={`translate(${-BANK.length} 0)`} />
              </g>
              <path d={BANK_D.fill} fill="var(--color-white)" />
              <path d={BANK_D.line} fill="var(--sky-cloud-line)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#header-cloud-bank)" />
      </svg>
    </div>
  );
}
