'use client';

import React from 'react';

import { useInsideDashboardShell } from '@/components/layout/DashboardShell';
import { cn } from '@/lib/utils';

/**
 * The content column under a `PageHeader`.
 *
 * Every settings screen opened with `page-shell page-shell-narrow py-10`, which is
 * correct on a standalone page and wrong inside the cabinet: the shell already
 * provides a `page-shell`, so nesting a second one re-centred the body at 1040px
 * inside a column that was already narrower than that and added a second dose of
 * horizontal padding. The result was a header band flush with the sidebar and a
 * body indented out of line with it on every master screen. Inside the shell the
 * column *is* the container, so here it adds nothing but the vertical rhythm.
 */
export function PageBody({
  narrow = false,
  className,
  children,
}: {
  /** Standalone only: hold a single form or reading column to 1040px. */
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const inShell = useInsideDashboardShell();

  return (
    <div
      className={cn(
        'space-y-5',
        inShell ? '' : cn('page-shell py-8 sm:py-10', narrow && 'page-shell-narrow'),
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageBody;
