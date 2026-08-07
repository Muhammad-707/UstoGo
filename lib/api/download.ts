import { ApiError, getAccessToken } from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://ustogo-backend.onrender.com/api/v1';

/**
 * For binary/file GET endpoints (`.ics`, `.pdf`) — `api.get` always parses JSON, which
 * a file response is not. Fetches the file as a Blob with the bearer token attached and
 * triggers a browser download; no retry/refresh/cache logic since these are one-off,
 * user-initiated downloads rather than data the UI renders.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const payload = (await res.json()) as { message?: string; code?: string };
      message = payload.message ?? message;
      code = payload.code;
    } catch {
      // non-JSON error body — fall back to statusText
    }
    throw new ApiError(res.status, message, code);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
