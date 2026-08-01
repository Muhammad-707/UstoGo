// Placeholder imagery reused across pages whenever a real image URL (avatar/cover) isn't
// available from the backend yet (avatarFileId is a file id, not a directly renderable URL).
// These are the same unsplash URLs the old lib/mockData.ts used for master avatars/covers.

export const PLACEHOLDER_AVATARS: string[] = [
  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
];

export const PLACEHOLDER_COVERS: string[] = [
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
];

export const PLACEHOLDER_REVIEWER_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarUrl(seed: string): string {
  if (!seed) return PLACEHOLDER_AVATARS[0];
  return PLACEHOLDER_AVATARS[hashSeed(seed) % PLACEHOLDER_AVATARS.length];
}

export function getCoverUrl(seed: string): string {
  if (!seed) return PLACEHOLDER_COVERS[0];
  return PLACEHOLDER_COVERS[hashSeed(seed) % PLACEHOLDER_COVERS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
