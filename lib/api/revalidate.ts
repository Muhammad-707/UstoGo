/**
 * Clears the server-side 'masters' page-data cache (search/home/landing —
 * see lib/api/page-data.ts) right after a master-affecting mutation, so other
 * users don't wait out the fallback revalidate window. Best-effort: a failure
 * here just falls back to that window, so it never blocks or throws on the caller.
 */
export function revalidateMastersCache(): void {
  fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: ['masters'] }),
  }).catch(() => {});
}
