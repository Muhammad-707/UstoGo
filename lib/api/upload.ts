import { filesApi } from './endpoints';

export async function uploadFile(file: File, purpose: string): Promise<string> {
  const presigned = await filesApi.presign({ mimeType: file.type, sizeBytes: file.size, purpose });
  await fetch(presigned.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  await filesApi.confirm(presigned.id);
  return presigned.id;
}
