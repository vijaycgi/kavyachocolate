// Shared limits and helpers for admin image uploads. This file is imported by
// both the browser (pre-flight checks) and the server (validation), so it must
// stay dependency-free and must not import `server-only`.

/**
 * Vercel rejects serverless request bodies over roughly 4.5 MB before the
 * handler runs, so keep the user-facing limit just below that. Uploads are
 * re-encoded to WebP, which keeps the stored assets much smaller.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Guard against decompression bombs while still allowing normal photography. */
export const MAX_IMAGE_INPUT_PIXELS = 40_000_000;

/** Long edge of the stored image, in pixels. */
export const MAX_IMAGE_EDGE = 2000;

export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** MIME types we accept from the file picker. */
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** Formats `sharp` is allowed to decode, keyed by its reported format name. */
export const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

export function mediaUrl(id: string) {
  return `/api/media/${id}`;
}

export function imageMimeTypeAllowed(type: string) {
  // Browsers occasionally report an empty type for drag-and-dropped files;
  // the server still sniffs the bytes with sharp before storing anything.
  return type === "" || ALLOWED_IMAGE_MIME_TYPES.has(type.toLowerCase());
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

/**
 * Keep a human-readable original name for reference, but force a `.webp`
 * extension because every stored asset is re-encoded. Never use this value as
 * a filesystem path.
 */
export function sanitizeFilename(name: string) {
  const base = (name.split(/[\\/]/).pop() ?? "image").normalize("NFKD");
  const stem = base
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w .-]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96);
  // Keep the stored name readable, but never let it collapse to punctuation.
  const safe = /[a-z0-9]/i.test(stem) ? stem : "image";
  return `${safe}.webp`;
}
