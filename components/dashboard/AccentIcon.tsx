'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AccentTone = 'blue' | 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

/**
 * A tinted tile, a hairline ring, and the glyph in the tone's own ink.
 *
 * This replaces the saturated solid-colour tile with a halo breathing behind it that the
 * cabinet used everywhere. One of those, on a landing page, is a signature. Fifteen of
 * them down a dashboard — four on the metric row, one on the header of every panel — is
 * fifteen traffic lights competing with the figures they are supposed to be labelling,
 * and the pulse reads as a loading state rather than as life. Quiet chrome, loud numbers.
 */
const TONE: Record<AccentTone, string> = {
  blue: 'from-blue-500/15 to-blue-500/[0.04] ring-blue-500/20 text-blue-600 dark:from-blue-400/20 dark:to-blue-400/[0.06] dark:ring-blue-400/25 dark:text-blue-300',
  sky: 'from-sky-500/15 to-sky-500/[0.04] ring-sky-500/20 text-sky-600 dark:from-sky-400/20 dark:to-sky-400/[0.06] dark:ring-sky-400/25 dark:text-sky-300',
  emerald:
    'from-emerald-500/15 to-emerald-500/[0.04] ring-emerald-500/20 text-emerald-600 dark:from-emerald-400/20 dark:to-emerald-400/[0.06] dark:ring-emerald-400/25 dark:text-emerald-300',
  amber:
    'from-amber-500/18 to-amber-500/[0.05] ring-amber-500/25 text-amber-600 dark:from-amber-400/20 dark:to-amber-400/[0.06] dark:ring-amber-400/25 dark:text-amber-300',
  violet:
    'from-violet-500/15 to-violet-500/[0.04] ring-violet-500/20 text-violet-600 dark:from-violet-400/20 dark:to-violet-400/[0.06] dark:ring-violet-400/25 dark:text-violet-300',
  rose: 'from-rose-500/15 to-rose-500/[0.04] ring-rose-500/20 text-rose-600 dark:from-rose-400/20 dark:to-rose-400/[0.06] dark:ring-rose-400/25 dark:text-rose-300',
  slate:
    'from-slate-500/15 to-slate-500/[0.04] ring-slate-500/20 text-slate-600 dark:from-white/15 dark:to-white/[0.04] dark:ring-white/20 dark:text-slate-200',
};

const SIZE = {
  sm: { box: 'h-9 w-9 rounded-[10px]', icon: 16 },
  md: { box: 'h-10 w-10 rounded-xl', icon: 18 },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 21 },
} as const;

export function AccentIcon({
  Icon,
  tone = 'blue',
  size = 'md',
  className,
}: {
  Icon: LucideIcon;
  tone?: AccentTone;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br ring-1 ring-inset transition-transform duration-300 group-hover:scale-[1.06]',
        s.box,
        TONE[tone],
        className,
      )}
    >
      <Icon size={s.icon} strokeWidth={2.1} />
    </span>
  );
}

export default AccentIcon;
