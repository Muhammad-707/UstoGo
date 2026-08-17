/**
 * Shrink a photo in the browser before it is uploaded.
 *
 * A phone camera writes 4–12 MB per shot. Sending that over a Dushanbe mobile uplink is
 * the whole reason attaching one picture to a booking took the better part of a minute —
 * and the master then looks at it in a 20 mm thumbnail. Re-encoded to 1600 px on the long
 * edge, the same photo is 200–400 KB: visibly identical on screen, roughly fifteen times
 * less to send.
 *
 * Everything here is best-effort. If the browser cannot decode the file, or the re-encode
 * somehow comes out bigger, the original is returned unchanged — a failed optimisation
 * must never become a failed upload.
 */

export interface CompressOptions {
  /** Longest edge of the result, in CSS pixels. */
  maxEdge?: number;
  /** JPEG quality, 0–1. */
  quality?: number;
  /** Files at or below this size are sent as they are. */
  skipBelowBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 1600,
  quality: 0.82,
  skipBelowBytes: 300 * 1024,
};

/** Formats that must survive untouched: vector, animated, or already-tiny. */
function shouldSkip(file: File, skipBelowBytes: number): boolean {
  if (!file.type.startsWith('image/')) return true;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return true;
  return file.size <= skipBelowBytes;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    // `imageOrientation: 'from-image'` so a portrait photo does not come back on its side.
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url;
    });
  } finally {
    // The bitmap is already in memory by the time the promise settles.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxEdge, quality, skipBelowBytes } = { ...DEFAULTS, ...options };
  if (typeof document === 'undefined' || shouldSkip(file, skipBelowBytes)) return file;

  try {
    const source = await decode(file);
    const width = 'width' in source ? source.width : 0;
    const height = 'height' in source ? source.height : 0;
    if (!width || !height) return file;

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source as CanvasImageSource, 0, 0, targetWidth, targetHeight);
    if ('close' in source) source.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
