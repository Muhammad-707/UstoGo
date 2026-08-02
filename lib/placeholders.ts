// Deterministic fallback imagery used whenever a real avatar/banner isn't available yet
// (avatarFileId/bannerFileId is null because the user never uploaded one). Previously this
// picked a random stranger's stock photo per id, which looked like a bug (a different fake
// face every time, and a different fake face on every page) — now it renders the person's
// own initials on a consistent brand gradient, the same pattern Slack/Google use.

const GRADIENTS: [string, string][] = [
  ['#f59e0b', '#ea580c'], // amber -> orange (master brand)
  ['#3b82f6', '#6366f1'], // blue -> indigo (client brand)
  ['#10b981', '#0ea5e9'], // emerald -> sky
  ['#ec4899', '#8b5cf6'], // pink -> violet
  ['#14b8a6', '#0891b2'], // teal -> cyan
  ['#f43f5e', '#f59e0b'], // rose -> amber
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gradientFor(seed: string): [string, string] {
  return GRADIENTS[hashSeed(seed) % GRADIENTS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function initialsAvatarDataUri(name: string, seed: string): string {
  const initials = getInitials(name || '?');
  const [from, to] = gradientFor(seed || name || '0');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="200" height="200" fill="url(#g)"/>` +
    `<text x="100" y="112" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" ` +
    `font-size="76" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function gradientCoverDataUri(seed: string): string {
  const [from, to] = gradientFor(seed || '0');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="1200" height="400" fill="url(#g)"/>` +
    `<circle cx="1050" cy="60" r="220" fill="#ffffff" opacity="0.06"/>` +
    `<circle cx="120" cy="360" r="180" fill="#ffffff" opacity="0.06"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Renders the person's initials on a deterministic gradient. Pass `name` whenever it's known — it's what actually gets shown. */
export function getAvatarUrl(seed: string, name?: string): string {
  return initialsAvatarDataUri(name ?? '', seed || name || '0');
}

/** Deterministic gradient banner — no more random strangers' bathrooms/electricians as a default cover. */
export function getCoverUrl(seed: string): string {
  return gradientCoverDataUri(seed);
}

export const PLACEHOLDER_REVIEWER_AVATAR = initialsAvatarDataUri('?', '0');
