'use client';

import React from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { useInsideDashboardShell } from '@/components/layout/DashboardShell';
import { cn } from '@/lib/utils';

export type PageHeaderAccent = 'blue' | 'amber' | 'violet' | 'emerald';

interface AccentStyle {
  /** Surface gradient — the band's own colour, light and dark. */
  surface: string;
  /** Hairline around the band. */
  border: string;
  /** The glyph tile: tinted fill, hairline ring, icon in the same ink. */
  tile: string;
  /** The eyebrow pill. */
  pill: string;
  /** The two glows behind the band. */
  glowA: string;
  glowB: string;
  /** The lit rule along the top edge. */
  rule: string;
}

const ACCENT: Record<PageHeaderAccent, AccentStyle> = {
  blue: {
    surface: 'from-white via-blue-50/70 to-indigo-50/80 dark:from-[#0A0F26] dark:via-[#0E1533] dark:to-[#090C1E]',
    border: 'border-blue-200/70 dark:border-white/10',
    tile: 'from-blue-500/15 to-blue-500/[0.04] ring-blue-500/20 text-blue-600 dark:from-blue-400/20 dark:to-blue-400/[0.06] dark:ring-blue-400/25 dark:text-blue-300',
    pill: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-200',
    glowA: 'bg-blue-500/15 dark:bg-blue-600/30',
    glowB: 'bg-violet-500/10 dark:bg-indigo-500/20',
    rule: 'via-blue-500/50 dark:via-cyan-300/60',
  },
  amber: {
    surface: 'from-white via-amber-50/70 to-orange-50/80 dark:from-[#16100A] dark:via-[#1D1509] dark:to-[#120C06]',
    border: 'border-amber-200/70 dark:border-white/10',
    tile: 'from-amber-500/18 to-amber-500/[0.05] ring-amber-500/25 text-amber-600 dark:from-amber-400/20 dark:to-amber-400/[0.06] dark:ring-amber-400/25 dark:text-amber-300',
    pill: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-200',
    glowA: 'bg-amber-500/15 dark:bg-amber-600/25',
    glowB: 'bg-orange-500/10 dark:bg-orange-500/20',
    rule: 'via-amber-500/50 dark:via-amber-300/60',
  },
  violet: {
    surface: 'from-white via-violet-50/70 to-indigo-50/80 dark:from-[#0D0A22] dark:via-[#140F31] dark:to-[#0A081C]',
    border: 'border-violet-200/70 dark:border-white/10',
    tile: 'from-violet-500/15 to-violet-500/[0.04] ring-violet-500/20 text-violet-600 dark:from-violet-400/20 dark:to-violet-400/[0.06] dark:ring-violet-400/25 dark:text-violet-300',
    pill: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:border-violet-300/25 dark:bg-violet-400/10 dark:text-violet-200',
    glowA: 'bg-violet-500/15 dark:bg-violet-600/30',
    glowB: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20',
    rule: 'via-violet-500/50 dark:via-violet-300/60',
  },
  emerald: {
    surface: 'from-white via-emerald-50/70 to-teal-50/80 dark:from-[#04160F] dark:via-[#071E17] dark:to-[#04120D]',
    border: 'border-emerald-200/70 dark:border-white/10',
    tile: 'from-emerald-500/15 to-emerald-500/[0.04] ring-emerald-500/20 text-emerald-600 dark:from-emerald-400/20 dark:to-emerald-400/[0.06] dark:ring-emerald-400/25 dark:text-emerald-300',
    pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-200',
    glowA: 'bg-emerald-500/15 dark:bg-emerald-600/25',
    glowB: 'bg-teal-500/10 dark:bg-teal-500/20',
    rule: 'via-emerald-500/50 dark:via-emerald-300/60',
  },
};

interface PageHeaderProps {
  icon: string;
  eyebrow: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  accent?: PageHeaderAccent;
}

/**
 * The band every inner page opens with.
 *
 * It carries the cabinet's signature surface — an accent-tinted gradient, two soft glows,
 * a fine instrument grid and a lit hairline along the top edge — so that clicking any
 * item in the sidebar lands you somewhere that plainly belongs to the same product as
 * the dashboard you came from. It used to be a flat white rectangle with a saturated
 * glyph block on it, which is why every screen behind the sidebar felt like a different,
 * older application.
 *
 * Both themes are stated for every colour: the band is tinted in light mode and deep in
 * dark mode, never a dark slab dropped into a bright page.
 *
 * Outside the cabinet it is still a full-width strip with its own `page-shell`, so it
 * lines up with the navbar above it; inside, it becomes a card in the content column,
 * because a full-bleed strip nested in the shell's container indented itself twice.
 */
export function PageHeader({ icon, eyebrow, title, hint, action, accent = 'blue' }: PageHeaderProps) {
  const tone = ACCENT[accent];
  const inShell = useInsideDashboardShell();

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden border bg-gradient-to-br',
        tone.surface,
        inShell ? cn('rounded-3xl shadow-lg shadow-slate-900/[0.04] dark:shadow-none', tone.border) : 'border-x-0 border-t-0 border-b-slate-200/80 dark:border-b-slate-800/80',
      )}
    >
      <div aria-hidden className={cn('pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full blur-3xl', tone.glowA)} />
      <div aria-hidden className={cn('pointer-events-none absolute -bottom-32 right-4 h-72 w-72 rounded-full blur-3xl', tone.glowB)} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(99,102,241,0.10) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
          tone.rule,
        )}
      />

      <div
        className={cn(
          'relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center',
          inShell ? 'p-6 sm:p-7' : 'page-shell py-7 sm:py-9',
        )}
      >
        <div className="group flex min-w-0 items-center gap-4">
          <span
            className={cn(
              'hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset transition-transform duration-300 group-hover:scale-[1.05] sm:flex',
              tone.tile,
            )}
          >
            <Icon name={icon} size={24} />
          </span>

          <div className="min-w-0">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]',
                tone.pill,
              )}
            >
              {eyebrow}
            </span>
            <h1
              className={cn(
                'mt-2 font-extrabold leading-tight tracking-[-0.02em] text-slate-900 dark:text-white',
                inShell ? 'text-[26px] sm:text-[30px]' : 'text-2xl sm:text-[34px]',
              )}
            >
              {title}
            </h1>
            {hint && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{hint}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
