'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { getSidebarConfig } from '@/lib/dashboardNav';

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
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={open}
              aria-label={t('navMenu')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                {t(config.titleKey)}
              </p>
              <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
    >
      <main className="space-y-6 pb-10">{children}</main>
    </DashboardShell>
  );
}
