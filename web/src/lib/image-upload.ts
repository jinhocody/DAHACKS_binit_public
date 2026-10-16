// Shared validation for uploaded photos (used by /api/scan and /api/verify).
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);

/** Returns the uploaded file, or an error message for the user. */
export function readImageField(form: FormData, field: string, label = "image"): File | string {
  const image = form.get(field);
  if (!image || typeof image === "string") return `Missing ${label}.`;
  if (!ALLOWED_TYPES.has(image.type)) return `Unsupported ${label} type. Please upload a JPEG, PNG, WebP or HEIC photo.`;
  if (image.size === 0) return `The ${label} is empty.`;
  if (image.size > MAX_IMAGE_BYTES) return `The ${label} is too large (max 4MB).`;
  return image;
}
