// Local visual lookup for real backend categories (icon + gradient), keyed by category slug.
// The real API's Category type has no iconName/bgGradient fields, so we keep the same
// slug -> visual mapping that the old mock CATEGORIES used, to preserve the exact same look
// for known categories. Unknown slugs fall back to a generic icon/gradient.

export interface CategoryVisual {
  iconName: string;
  bgGradient: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  plumbing: { iconName: 'Wrench', bgGradient: 'from-blue-500/10 to-cyan-500/10' },
  electrical: { iconName: 'Zap', bgGradient: 'from-amber-500/10 to-yellow-500/10' },
  'ac-repair': { iconName: 'Wind', bgGradient: 'from-sky-500/10 to-blue-500/10' },
  painting: { iconName: 'Paintbrush', bgGradient: 'from-purple-500/10 to-indigo-500/10' },
  carpentry: { iconName: 'Hammer', bgGradient: 'from-emerald-500/10 to-teal-500/10' },
  cleaning: { iconName: 'Sparkles', bgGradient: 'from-teal-500/10 to-emerald-500/10' },
  'appliance-repair': { iconName: 'Tv', bgGradient: 'from-rose-500/10 to-pink-500/10' },
  masonry: { iconName: 'Grid', bgGradient: 'from-orange-500/10 to-amber-500/10' },
  welding: { iconName: 'Flame', bgGradient: 'from-red-500/10 to-orange-500/10' },
  roofing: { iconName: 'Home', bgGradient: 'from-slate-500/10 to-zinc-500/10' },
  'interior-design': { iconName: 'Compass', bgGradient: 'from-violet-500/10 to-purple-500/10' },
  'cctv-installer': { iconName: 'ShieldCheck', bgGradient: 'from-cyan-500/10 to-blue-500/10' },
  networking: { iconName: 'Wifi', bgGradient: 'from-blue-500/10 to-indigo-500/10' },
  locksmith: { iconName: 'Key', bgGradient: 'from-amber-500/10 to-orange-500/10' },
  handyman: { iconName: 'Tool', bgGradient: 'from-emerald-500/10 to-cyan-500/10' },
  hairdressing: { iconName: 'Scissors', bgGradient: 'from-pink-500/10 to-rose-500/10' },
  massage: { iconName: 'Heart', bgGradient: 'from-rose-500/10 to-red-500/10' },
  'nail-care': { iconName: 'Sparkles', bgGradient: 'from-fuchsia-500/10 to-pink-500/10' },
  languages: { iconName: 'Globe', bgGradient: 'from-indigo-500/10 to-blue-500/10' },
  mathematics: { iconName: 'Calculator', bgGradient: 'from-cyan-500/10 to-teal-500/10' },
};

const DEFAULT_VISUAL: CategoryVisual = {
  iconName: 'Wrench',
  bgGradient: 'from-slate-500/10 to-zinc-500/10',
};

export function getCategoryVisual(slug?: string | null): CategoryVisual {
  if (!slug) return DEFAULT_VISUAL;
  return CATEGORY_VISUALS[slug] ?? DEFAULT_VISUAL;
}
