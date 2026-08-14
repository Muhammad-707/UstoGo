// Local visual lookup for real backend categories, keyed by category slug.
// The real API's Category type carries no artwork of its own, so everything a card
// needs to look like something — the icon, the photo, the accent colour — lives here.
//
// Three things per category:
//   * `Icon`      the real lucide-react glyph (not the hand-rolled <Icon /> switch,
//                 which only ever had rough approximations of a dozen shapes).
//   * `image`     an Unsplash photo of the actual trade. Every id below was fetched
//                 and eyeballed before it landed here — a 404 or a stock photo of the
//                 wrong trade is worse than no photo at all.
//   * `tile`      the tint for the small icon chip that sits on top of the photo.
//
// `iconName` and `bgGradient` stay for the call sites still on the legacy <Icon />.

import type { LucideIcon } from 'lucide-react';
import {
  AirVent,
  BrickWall,
  Calculator,
  Cctv,
  Flame,
  Flower2,
  Hammer,
  House,
  KeyRound,
  Languages,
  PaintRoller,
  Scissors,
  Sofa,
  Sparkle,
  Sparkles,
  WashingMachine,
  Wifi,
  Wrench,
  Zap,
  Drill,
} from 'lucide-react';

export interface CategoryVisual {
  /** Legacy key for the hand-rolled `<Icon name="..." />` switch. */
  iconName: string;
  bgGradient: string;
  /** The real lucide glyph, for anything drawing a category today. */
  Icon: LucideIcon;
  /** Photograph of the trade itself. */
  image: string;
  /** Tint classes for the icon chip. */
  tile: string;
}

/** Unsplash CDN URL at a given width — `auto=format` hands WebP to browsers that take it. */
export function categoryImage(id: string, width = 800): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

const IMG = {
  plumbing: 'photo-1607472586893-edb57bdc0e39',
  electrical: 'photo-1621905251189-08b45d6a269e',
  ac: 'photo-1698479603408-1a66a6d9e80f',
  painting: 'photo-1562259949-e8e7689d7828',
  carpentry: 'photo-1601058268499-e52658b8bb88',
  cleaning: 'photo-1581578731548-c64695cc6952',
  appliance: 'photo-1581092918056-0c4c3acd3789',
  masonry: 'photo-1600566752355-35792bedcfea',
  welding: 'photo-1504328345606-18bbc8c9d7d1',
  roofing: 'photo-1632759145351-1d592919f522',
  interior: 'photo-1616486338812-3dadae4b4ace',
  cctv: 'photo-1557597774-9d273605dfa9',
  networking: 'photo-1544197150-b99a580bb7a8',
  locksmith: 'photo-1558618666-fcd25c85cd64',
  handyman: 'photo-1581244277943-fe4a9c777189',
  hair: 'photo-1560066984-138dadb4c035',
  massage: 'photo-1544161515-4ab6ce6db874',
  nails: 'photo-1604654894610-df63bc536371',
  languages: 'photo-1546410531-bb4caa6b424d',
  math: 'photo-1509228468518-180dd4864904',
  fallback: 'photo-1503387762-592deb58ef4e',
} as const;

/**
 * The categories hero art. Two frames, not one full-bleed background: a bright
 * finished kitchen as the main plate and a craftsman inset overlapping its corner.
 * The page used to run a dark construction shot edge to edge behind the headline,
 * which meant white-on-photo text over a moving background and a page that opened
 * almost black — the result of the work reads better than the scaffolding does.
 */
export const CATEGORIES_HERO_IMAGE = categoryImage('photo-1541123437800-1bb1317badc2', 1600);
export const CATEGORIES_HERO_INSET = categoryImage('photo-1621905252507-b35492cc74b4', 800);

const TILE = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
} as const;

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  plumbing: { iconName: 'Wrench', bgGradient: 'from-blue-500/10 to-cyan-500/10', Icon: Wrench, image: categoryImage(IMG.plumbing), tile: TILE.blue },
  electrical: { iconName: 'Zap', bgGradient: 'from-amber-500/10 to-yellow-500/10', Icon: Zap, image: categoryImage(IMG.electrical), tile: TILE.amber },
  'ac-repair': { iconName: 'Wind', bgGradient: 'from-sky-500/10 to-blue-500/10', Icon: AirVent, image: categoryImage(IMG.ac), tile: TILE.sky },
  painting: { iconName: 'Paintbrush', bgGradient: 'from-purple-500/10 to-indigo-500/10', Icon: PaintRoller, image: categoryImage(IMG.painting), tile: TILE.violet },
  carpentry: { iconName: 'Hammer', bgGradient: 'from-emerald-500/10 to-teal-500/10', Icon: Hammer, image: categoryImage(IMG.carpentry), tile: TILE.emerald },
  cleaning: { iconName: 'Sparkles', bgGradient: 'from-teal-500/10 to-emerald-500/10', Icon: Sparkles, image: categoryImage(IMG.cleaning), tile: TILE.teal },
  'appliance-repair': { iconName: 'Tv', bgGradient: 'from-rose-500/10 to-pink-500/10', Icon: WashingMachine, image: categoryImage(IMG.appliance), tile: TILE.rose },
  masonry: { iconName: 'Grid', bgGradient: 'from-orange-500/10 to-amber-500/10', Icon: BrickWall, image: categoryImage(IMG.masonry), tile: TILE.orange },
  welding: { iconName: 'Flame', bgGradient: 'from-red-500/10 to-orange-500/10', Icon: Flame, image: categoryImage(IMG.welding), tile: TILE.red },
  roofing: { iconName: 'Home', bgGradient: 'from-slate-500/10 to-zinc-500/10', Icon: House, image: categoryImage(IMG.roofing), tile: TILE.slate },
  'interior-design': { iconName: 'Compass', bgGradient: 'from-violet-500/10 to-purple-500/10', Icon: Sofa, image: categoryImage(IMG.interior), tile: TILE.purple },
  'cctv-installer': { iconName: 'ShieldCheck', bgGradient: 'from-cyan-500/10 to-blue-500/10', Icon: Cctv, image: categoryImage(IMG.cctv), tile: TILE.cyan },
  networking: { iconName: 'Wifi', bgGradient: 'from-blue-500/10 to-indigo-500/10', Icon: Wifi, image: categoryImage(IMG.networking), tile: TILE.indigo },
  locksmith: { iconName: 'Key', bgGradient: 'from-amber-500/10 to-orange-500/10', Icon: KeyRound, image: categoryImage(IMG.locksmith), tile: TILE.amber },
  handyman: { iconName: 'Tool', bgGradient: 'from-emerald-500/10 to-cyan-500/10', Icon: Drill, image: categoryImage(IMG.handyman), tile: TILE.emerald },
  hairdressing: { iconName: 'Scissors', bgGradient: 'from-pink-500/10 to-rose-500/10', Icon: Scissors, image: categoryImage(IMG.hair), tile: TILE.pink },
  massage: { iconName: 'Heart', bgGradient: 'from-rose-500/10 to-red-500/10', Icon: Flower2, image: categoryImage(IMG.massage), tile: TILE.rose },
  'nail-care': { iconName: 'Sparkles', bgGradient: 'from-fuchsia-500/10 to-pink-500/10', Icon: Sparkle, image: categoryImage(IMG.nails), tile: TILE.pink },
  languages: { iconName: 'Globe', bgGradient: 'from-indigo-500/10 to-blue-500/10', Icon: Languages, image: categoryImage(IMG.languages), tile: TILE.indigo },
  mathematics: { iconName: 'Calculator', bgGradient: 'from-cyan-500/10 to-teal-500/10', Icon: Calculator, image: categoryImage(IMG.math), tile: TILE.cyan },
};

const DEFAULT_VISUAL: CategoryVisual = {
  iconName: 'Wrench',
  bgGradient: 'from-slate-500/10 to-zinc-500/10',
  Icon: Wrench,
  image: categoryImage(IMG.fallback),
  tile: TILE.slate,
};

export function getCategoryVisual(slug?: string | null): CategoryVisual {
  if (!slug) return DEFAULT_VISUAL;
  return CATEGORY_VISUALS[slug] ?? DEFAULT_VISUAL;
}
