import { filesApi } from './endpoints';

export async function uploadFile(file: File, purpose: string): Promise<string> {
  const presigned = await filesApi.presign({ mimeType: file.type, sizeBytes: file.size, purpose });
  await fetch(presigned.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  await filesApi.confirm(presigned.fileId);
  return presigned.fileId;
}

/** Short-lived read URL for the caller's own confirmed file (or null). */
export async function resolveOwnFileUrl(fileId: string | null | undefined): Promise<string | null> {
  if (!fileId) return null;
  try {
    const res = await filesApi.url(fileId);
    return res.url;
  } catch {
    return null;
  }
}
