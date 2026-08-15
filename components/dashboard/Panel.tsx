'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

import { AccentIcon, type AccentTone } from '@/components/dashboard/AccentIcon';
import { cn } from '@/lib/utils';

/**
 * The one surface a cabinet panel is drawn on.
 *
 * Deliberately quiet: a 24px radius, a hairline at 6% black and a shadow you have to
 * look for. Depth used to come from a heavy drop shadow and a coloured rule along the
 * top edge of every card, which is what made the cabinet read as dated — the chrome was
 * doing the work the content should do. Structure now comes from spacing and type, and
 * colour is spent only where something is interactive or needs a status.
 */
export const PANEL_SURFACE =
  'rounded-3xl border border-slate-200 bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-none';

export type PanelAccent = 'neutral' | 'amber' | 'blue' | 'emerald' | 'violet' | 'rose';

const GLOW_TONE: Record<PanelAccent, AccentTone> = {
  neutral: 'slate',
  amber: 'amber',
  blue: 'blue',
  emerald: 'emerald',
  violet: 'violet',
  rose: 'rose',
};

interface PanelProps {
  title?: string;
  /** Small line above the title — the section this panel belongs to. */
  eyebrow?: string;
  description?: string;
  Icon?: LucideIcon;
  accent?: PanelAccent;
  /** Right-hand side of the header: a button, a filter row, a count. */
  action?: React.ReactNode;
  /** Renders a plain "see all" link on the right when no `action` is given. */
  href?: string;
  hrefLabel?: string;
  /** Hairline between the header and the body — for panels holding a list. */
  divided?: boolean;
  /** `none` when the body brings its own padding (a table, a full-bleed list). */
  padding?: 'default' | 'none';
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

export function PanelHeading({
  title,
  eyebrow,
  description,
  Icon,
  accent = 'neutral',
}: Pick<PanelProps, 'title' | 'eyebrow' | 'description' | 'Icon' | 'accent'>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {Icon && <AccentIcon Icon={Icon} tone={GLOW_TONE[accent]} size="sm" />}
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{eyebrow}</p>
        )}
        {title && (
          <h3 className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

/** A section of the cabinet: one surface, one header, one body. */
export function Panel({
  title,
  eyebrow,
  description,
  Icon,
  accent = 'neutral',
  action,
  href,
  hrefLabel,
  divided = false,
  padding = 'default',
  className,
  bodyClassName,
  children,
}: PanelProps) {
  const hasHeader = Boolean(title || eyebrow || description || action || href);

  return (
    <section className={cn(PANEL_SURFACE, 'group', 'flex flex-col overflow-hidden', className)}>
      {hasHeader && (
        <header
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-6 pt-6',
            divided ? 'border-b border-slate-100 pb-5 dark:border-slate-800' : 'pb-4',
          )}
        >
          <PanelHeading
            title={title}
            eyebrow={eyebrow}
            description={description}
            Icon={Icon}
            accent={accent}
          />
          {action ??
            (href ? (
              <Link
                href={href}
                className="group inline-flex shrink-0 items-center gap-1 rounded-lg px-1 py-0.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {hrefLabel}
                <ArrowRight size={14} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : null)}
        </header>
      )}

      <div
        className={cn(
          'min-w-0 flex-1',
          padding === 'default' && cn('px-6 pb-6', !hasHeader ? 'pt-6' : divided && 'pt-5'),
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export default Panel;
