export const MAX_SIDE = 1024;
export const QUALITY = 0.8;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}

/**
 * Draws an image or video frame downscaled to MAX_SIDE on its longest side and encodes it as JPEG.
 * Returns null if the browser can't encode it.
 */
export async function toJpeg(source: CanvasImageSource, srcWidth: number, srcHeight: number): Promise<Blob | null> {
  const scale = Math.min(1, MAX_SIDE / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff"; // flatten transparency for JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
}

/**
 * Downscales an image to MAX_SIDE on its longest side and re-encodes it as JPEG.
 * Runs entirely in the browser; nothing is persisted.
 * Falls back to the original file if the browser can't decode it (e.g. HEIC on some browsers).
 */
export async function resizeImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return (await toJpeg(img, img.naturalWidth, img.naturalHeight)) ?? file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
