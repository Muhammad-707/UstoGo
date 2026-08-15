'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { MASTER_CABINET_IMAGES } from '@/lib/placeholders';
import { cn } from '@/lib/utils';

export type HeroAccent = 'blue' | 'amber' | 'violet';

interface AccentStyle {
  /** The two photographs — daylight for light mode, dusk for dark. */
  light: string;
  dark: string;
  /** The eyebrow pill. */
  pill: string;
  /** The two brand glows. */
  glowA: string;
  glowB: string;
  /** The lit hairline along the top edge. */
  rule: string;
}

const ACCENT: Record<HeroAccent, AccentStyle> = {
  blue: {
    light: MASTER_CABINET_IMAGES.clientHeroLight,
    dark: MASTER_CABINET_IMAGES.clientHeroDark,
    pill: 'border-blue-200 bg-blue-50/90 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/25 dark:text-blue-100',
    glowA: 'bg-blue-500/15 dark:bg-blue-600/30',
    glowB: 'bg-violet-500/10 dark:bg-indigo-500/20',
    rule: 'via-blue-500/40 dark:via-sky-400/50',
  },
  amber: {
    light: MASTER_CABINET_IMAGES.heroLight,
    dark: MASTER_CABINET_IMAGES.heroDark,
    pill: 'border-amber-200 bg-amber-50/90 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/25 dark:text-amber-100',
    glowA: 'bg-amber-500/15 dark:bg-amber-600/25',
    glowB: 'bg-orange-500/10 dark:bg-orange-500/20',
    rule: 'via-amber-500/40 dark:via-amber-300/50',
  },
  violet: {
    light: MASTER_CABINET_IMAGES.adminHeroLight,
    dark: MASTER_CABINET_IMAGES.adminHeroDark,
    pill: 'border-violet-200 bg-violet-50/90 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/25 dark:text-violet-100',
    glowA: 'bg-violet-500/15 dark:bg-violet-600/30',
    glowB: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20',
    rule: 'via-violet-500/40 dark:via-violet-300/50',
  },
};

export interface HeroStat {
  label: string;
  value: string;
  Icon?: LucideIcon;
}

/**
 * The band each cabinet opens on.
 *
 * All three roles now open the same way the master's does: a photograph carrying the
 * whole band, an even veil over it, and the type on glass panels floating on top. What
 * this replaces was a saturated mesh gradient — a slab of pure blue, amber or violet that
 * stayed exactly as loud in light mode as in dark, and read as a banner ad sitting above
 * the actual page.
 *
 * Two photographs, swapped by theme, for the reason a single one cannot serve both: a
 * daylight frame under a dark scrim goes muddy, and a dusk frame under a white one turns
 * into grey noise. Every colour below is stated for both themes.
 */
export function CabinetHero({
  eyebrow,
  title,
  description,
  accent = 'blue',
  stats,
  media,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: HeroAccent;
  /** Up to four figures, shown as glass chips under the copy. */
  stats?: HeroStat[];
  /** An avatar, a logo, an illustration — whatever this role's face is. */
  media?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const a = ACCENT[accent];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative isolate overflow-hidden rounded-[2rem] border shadow-xl',
        'border-slate-200/80 bg-white shadow-slate-900/[0.06]',
        'dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40',
        className,
      )}
    >
      <img src={a.light} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover dark:hidden" />
      <img src={a.dark} alt="" aria-hidden className="absolute inset-0 hidden h-full w-full object-cover dark:block" />

      <div aria-hidden className="absolute inset-0 bg-white/25 dark:bg-slate-950/45" />
      <div aria-hidden className={cn('absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl', a.glowA)} />
      <div aria-hidden className={cn('absolute -bottom-32 left-1/3 h-72 w-72 rounded-full blur-3xl', a.glowB)} />
      <div
        aria-hidden
        className={cn('absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent', a.rule)}
      />

      <div className="relative space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className={cn(
              'flex min-w-0 items-center gap-4 rounded-3xl border px-4 py-4 backdrop-blur-xl sm:px-5',
              'border-white/70 bg-white/70 shadow-lg shadow-slate-900/5',
              'dark:border-white/15 dark:bg-slate-950/55 dark:shadow-none',
            )}
          >
            {media}
            <div className="min-w-0">
              <span
                className={cn(
                  'inline-block rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-widest backdrop-blur-md',
                  a.pill,
                )}
              >
                {eyebrow}
              </span>
              <h2 className="mt-1.5 truncate text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px] dark:text-white">
                {title}
              </h2>
              {description && (
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              )}
            </div>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'rounded-2xl border px-4 py-3 backdrop-blur-xl',
                  'border-white/70 bg-white/70 shadow-lg shadow-slate-900/5',
                  'dark:border-white/15 dark:bg-slate-950/55 dark:shadow-none',
                )}
              >
                <p className="flex items-center gap-1.5 truncate text-[12px] font-medium text-slate-500 dark:text-slate-300">
                  {s.Icon && <s.Icon size={13} strokeWidth={2} className="shrink-0" />}
                  {s.label}
                </p>
                <p className="mt-1 truncate text-[21px] font-bold leading-none tracking-[-0.03em] text-slate-900 tabular-nums dark:text-white">
                  {s.value}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default CabinetHero;
