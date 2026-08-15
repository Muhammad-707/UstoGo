'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { getSidebarConfig } from '@/lib/dashboardNav';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * A dashboard page: the cabinet shell plus this page's own title row.
 *
 * The chrome itself lives in `DashboardShell`, which `/settings/*` also uses — those
 * screens bring their own `PageHeader` and only need the sidebar.
 */
export function DashboardLayout({ children, role, title, subtitle, action }: DashboardLayoutProps) {
  const t = useTranslations('dashboardLayout');
  const config = getSidebarConfig(role);

  return (
    <DashboardShell
      role={role}
      renderMenuButton={(open) => (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={open}
              aria-label={t('navMenu')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-[28px] font-semibold leading-none tracking-[-0.03em] text-slate-900 sm:text-[32px] dark:text-white">
                {title}
              </h1>
              <p className="mt-2 flex items-center gap-2 truncate text-[13.5px] text-slate-500 dark:text-slate-400">
                <span
                  aria-hidden
                  className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br', config.gradientFrom, config.gradientTo)}
                />
                {t(config.titleKey)}
                {subtitle && <span className="text-slate-300 dark:text-slate-600">·</span>}
                {subtitle}
              </p>
            </div>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
    >
      <main className="space-y-5 pb-12">{children}</main>
    </DashboardShell>
  );
}
