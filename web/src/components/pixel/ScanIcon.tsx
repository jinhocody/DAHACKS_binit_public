// Pixel-art scanner frame (corner brackets + laser line) used wherever a "camera" icon used to be.
// Drawn on the same 16×16 grid as the other pixel icons, in one solid color (currentColor).
import { PixelIcon } from "./PixelIcon";

export function ScanIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <PixelIcon name="scan" size={size} className={className} light="transparent" />;
}
