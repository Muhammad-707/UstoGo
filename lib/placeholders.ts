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

/**
 * The photograph both welcome panels open on — the client feed's and the master's.
 *
 * A bright finished interior: the outcome the platform delivers, not a tool close-up.
 * Shared from here so the two cabinets cannot drift onto different pictures, which is
 * exactly how they ended up looking like two products.
 */
export const WELCOME_IMAGE =
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80';

/** Unsplash CDN URL for a photo id at a given width — `auto=format` hands WebP to browsers that take it. */
function unsplash(id: string, width: number): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/**
 * The photographs the master's cabinet is built on.
 *
 * Every id here is one already proven elsewhere in the product (the hero slider and the
 * category visuals), so the cabinet cannot end up with a 404 or with a picture of the
 * wrong trade — and so the signed-in half of the site is photographed from the same
 * library as the public half rather than looking like a second product.
 */
export const MASTER_CABINET_IMAGES = {
  /**
   * The band behind the master's own name — one photograph per theme.
   *
   * A single picture cannot serve both. The dark-mode shot was being reused under a
   * white scrim in light mode, where it turned into a grey smear with dark type over
   * it; a bright shot under the dark scrim goes muddy the other way. So there are two
   * frames of the *same* house — daylight interior and dusk exterior — swapped by the
   * theme. Same building, same architecture, so switching themes reads as the lights
   * going down rather than as a different product.
   *
   * Both have to survive being cropped to a very wide, very short band, which is why
   * they are scenes with depth rather than close-ups: a face or a single tool filling
   * the frame turns into an unreadable smear at 1300×220.
   */
  heroLight: unsplash('photo-1618221195710-dd6b41faaea6', 2000),
  heroDark: unsplash('photo-1600585154340-be6161a56a0c', 2000),
  /** The client's own band: the bright, finished room the platform delivers. */
  clientHeroLight: unsplash('photo-1600607687939-ce8a6c25118c', 2000),
  clientHeroDark: unsplash('photo-1600585154340-be6161a56a0c', 2000),
  /** The operator's band — a workplace rather than a home, because that is what it is. */
  adminHeroLight: unsplash('photo-1524758631624-e2822e304c36', 2000),
  adminHeroDark: unsplash('photo-1497366811353-6870744d04b2', 2000),
  /** Tools and wiring: prices and what you actually offer. */
  services: unsplash('photo-1621905251189-08b45d6a269e', 900),
  /** A craftsman mid-job: the hours you keep. */
  schedule: unsplash('photo-1581244277943-fe4a9c777189', 900),
  /** A finished wall: the proof you show clients. */
  portfolio: unsplash('photo-1562259949-e8e7689d7828', 900),
  /** A finished interior: what the work pays for. */
  payments: unsplash('photo-1616486338812-3dadae4b4ace', 900),
} as const;
