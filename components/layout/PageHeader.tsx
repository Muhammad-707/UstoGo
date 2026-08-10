import React from 'react';
import { Icon } from '@/components/icons/LucideIcons';

export type PageHeaderAccent = 'blue' | 'amber';

const ACCENT: Record<PageHeaderAccent, { tile: string; eyebrow: string; wash: string }> = {
  blue: {
    tile: 'from-blue-600 to-sky-500 shadow-blue-600/25',
    eyebrow: 'text-blue-600 dark:text-sky-400',
    wash: 'from-blue-500/10 dark:from-blue-500/10',
  },
  amber: {
    tile: 'from-amber-500 to-orange-600 shadow-amber-600/25',
    eyebrow: 'text-amber-600 dark:text-amber-400',
    wash: 'from-amber-500/10 dark:from-amber-500/10',
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
 * It is deliberately a full-width strip with its own `max-w-7xl` container rather than
 * a heading dropped inside the page's own column: the pages vary between `max-w-2xl`
 * and `max-w-7xl`, so a heading inside them started at a different left edge on every
 * page and none of them lined up with the wordmark in the navbar directly above. The
 * band is flush against the header, shares its container, and carries the page's accent
 * so a settings page reads as a continuation of the chrome instead of text floating on
 * the background.
 */
export function PageHeader({ icon, eyebrow, title, hint, action, accent = 'blue' }: PageHeaderProps) {
  const tone = ACCENT[accent];

  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${tone.wash} to-transparent`} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={`hidden sm:flex w-13 h-13 shrink-0 rounded-2xl bg-gradient-to-br ${tone.tile} text-white items-center justify-center shadow-lg w-[52px] h-[52px]`}
          >
            <Icon name={icon} size={24} />
          </div>
          <div className="min-w-0">
            <span className={`text-[11px] font-extrabold uppercase tracking-[0.15em] ${tone.eyebrow}`}>
              {eyebrow}
            </span>
            <h1 className="text-2xl sm:text-[32px] leading-tight font-extrabold text-slate-900 dark:text-white mt-1">
              {title}
            </h1>
            {hint && <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5">{hint}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
