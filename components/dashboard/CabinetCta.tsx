'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export type CtaAccent = 'blue' | 'amber' | 'violet';

const ACCENT: Record<CtaAccent, { band: string; glowA: string; glowB: string; body: string; solid: string; ghost: string }> = {
  blue: {
    band: 'from-blue-600 via-indigo-600 to-blue-800 shadow-blue-900/30',
    glowA: 'bg-sky-400/20',
    glowB: 'bg-purple-400/20',
    body: 'text-blue-100',
    solid: 'bg-white text-blue-900 hover:shadow-white/20',
    ghost: 'bg-blue-900/60 border-blue-400/40 hover:bg-blue-900/80',
  },
  amber: {
    band: 'from-amber-500 via-orange-600 to-orange-800 shadow-orange-900/30',
    glowA: 'bg-amber-200/25',
    glowB: 'bg-rose-400/20',
    body: 'text-amber-50',
    solid: 'bg-white text-orange-900 hover:shadow-white/20',
    ghost: 'bg-orange-900/50 border-amber-300/40 hover:bg-orange-900/70',
  },
  violet: {
    band: 'from-violet-600 via-purple-600 to-indigo-800 shadow-violet-900/30',
    glowA: 'bg-fuchsia-400/20',
    glowB: 'bg-sky-400/20',
    body: 'text-violet-100',
    solid: 'bg-white text-violet-900 hover:shadow-white/20',
    ghost: 'bg-violet-900/60 border-violet-400/40 hover:bg-violet-900/80',
  },
};

export interface CtaAction {
  href: string;
  label: string;
}

/**
 * The closing band the landing page ends on, in the cabinet's own colour.
 *
 * Every dashboard used to stop dead at the last data panel — the page simply ran out.
 * The public pages close with a statement and two ways forward, and that is as useful
 * signed in as signed out: it is where "and now what" gets an answer, in the role's own
 * accent so a master's cabinet closes amber and an admin's violet.
 */
export function CabinetCta({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  accent = 'blue',
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  primary: CtaAction;
  secondary?: CtaAction;
  accent?: CtaAccent;
  className?: string;
}) {
  const a = ACCENT[accent];

  return (
    <section
      className={cn(
        'relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-2xl md:flex-row sm:p-12',
        a.band,
        className,
      )}
    >
      <div aria-hidden className={cn('absolute -right-10 -top-20 h-72 w-72 rounded-full blur-3xl animate-float', a.glowA)} />
      <div
        aria-hidden
        className={cn('absolute -bottom-24 -left-10 h-72 w-72 rounded-full blur-3xl animate-float', a.glowB)}
        style={{ animationDelay: '1s' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative max-w-xl space-y-4 text-center md:text-left">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className={cn('text-sm leading-relaxed', a.body)}>{description}</p>}
      </div>

      <div className="relative flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            href={primary.href}
            className={cn(
              'block whitespace-nowrap rounded-2xl px-7 py-4 text-center text-sm font-extrabold shadow-xl transition hover:shadow-2xl',
              a.solid,
            )}
          >
            {primary.label}
          </Link>
        </motion.div>

        {secondary && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={secondary.href}
              className={cn('block whitespace-nowrap rounded-2xl border px-7 py-4 text-center text-sm font-extrabold text-white transition', a.ghost)}
            >
              {secondary.label}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default CabinetCta;
