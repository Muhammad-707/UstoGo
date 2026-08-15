'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type GlowTone = 'blue' | 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

const TONE: Record<GlowTone, { bg: string; shadow: string; glow: string }> = {
  blue: { bg: 'bg-blue-600', shadow: 'shadow-blue-600/30', glow: 'bg-blue-600' },
  sky: { bg: 'bg-sky-500', shadow: 'shadow-sky-500/30', glow: 'bg-sky-500' },
  emerald: { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/30', glow: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500', shadow: 'shadow-amber-500/30', glow: 'bg-amber-500' },
  violet: { bg: 'bg-violet-600', shadow: 'shadow-violet-600/30', glow: 'bg-violet-600' },
  rose: { bg: 'bg-rose-500', shadow: 'shadow-rose-500/30', glow: 'bg-rose-500' },
  slate: { bg: 'bg-slate-800', shadow: 'shadow-slate-800/30', glow: 'bg-slate-700' },
};

const SIZE = {
  sm: { box: 'h-10 w-10 rounded-xl', icon: 17, inset: '-inset-1.5' },
  md: { box: 'h-12 w-12 rounded-2xl', icon: 20, inset: '-inset-2' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 24, inset: '-inset-2' },
} as const;

/**
 * The landing page's signature icon: a solid colour tile with a glow breathing behind
 * it, tilting on hover.
 *
 * The cabinets had drifted to flat grey glyphs while the public pages kept this, which
 * is why signing in felt like arriving at a different, duller product. Same component
 * both sides now — the staggered `delay` is what stops a row of them pulsing in unison,
 * which reads as a loading state rather than as life.
 */
export function GlowTile({
  tone = 'blue',
  size = 'md',
  delay = 0,
  className,
  children,
}: {
  tone?: GlowTone;
  size?: keyof typeof SIZE;
  /** Seconds of offset, so siblings breathe out of phase. */
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  const s = SIZE[size];

  return (
    <div className={cn('relative shrink-0', s.box, className)}>
      <motion.span
        aria-hidden
        className={cn('absolute rounded-2xl blur-lg', s.inset, t.glow)}
        animate={{ opacity: [0.15, 0.55, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay }}
      />
      <span
        className={cn(
          'relative z-10 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110',
          s.box,
          t.bg,
          t.shadow,
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function GlowIcon({
  Icon,
  tone = 'blue',
  size = 'md',
  delay = 0,
  className,
}: {
  Icon: LucideIcon;
  tone?: GlowTone;
  size?: keyof typeof SIZE;
  delay?: number;
  className?: string;
}) {
  return (
    <GlowTile tone={tone} size={size} delay={delay} className={className}>
      <Icon size={SIZE[size].icon} strokeWidth={2.2} />
    </GlowTile>
  );
}

export default GlowIcon;
