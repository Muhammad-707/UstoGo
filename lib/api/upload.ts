import { filesApi } from './endpoints';
import { ApiError } from './client';

export async function uploadFile(file: File, purpose: string): Promise<string> {
  const presigned = await filesApi.presign({ mimeType: file.type, sizeBytes: file.size, purpose });
  const res = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      `Storage rejected the upload (HTTP ${res.status}). Check the backend S3 keys and region.`,
      'STORAGE_UPLOAD_FAILED'
    );
  }
  await filesApi.confirm(presigned.fileId);
  return presigned.fileId;
}

// Signed read URLs from the backend live 15 minutes (X-Amz-Expires=900).
// Cache them per fileId so re-mounting pages (profile, dashboard, header)
// doesn't repeat the round-trip for the same photo.
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const READ_URL_TTL = 10 * 60_000;

/** Short-lived read URL for the caller's own confirmed file (or null). */
export async function resolveOwnFileUrl(fileId: string | null | undefined): Promise<string | null> {
  if (!fileId) return null;
  const now = Date.now();
  const cached = urlCache.get(fileId);
  if (cached && cached.expiresAt > now) return cached.url;
  try {
    const res = await filesApi.url(fileId);
    urlCache.set(fileId, { url: res.url, expiresAt: now + READ_URL_TTL });
    return res.url;
  } catch {
    return null;
  }
}
