'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { getSidebarConfig } from '@/lib/dashboardNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * The hero card carried its own notification bell and profile dropdown, which is the
 * same bell and the same dropdown the global navbar renders two rows above it — the
 * duplicate showed on all three roles and stole the space the page's own action needed.
 * Both were removed rather than restyled: there is one place to read notifications and
 * one place to sign out, and it is the header.
 */
export function DashboardLayout({ children, role, title, subtitle, action }: DashboardLayoutProps) {
  const t = useTranslations('dashboardLayout');
  const pathname = usePathname();
  const config = getSidebarConfig(role);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="page-shell pt-5 sm:pt-7">
        {/* Hero card */}
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} p-5 sm:p-7 shadow-xl ${config.glow} ring-1 ring-black/5`}>
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="absolute -top-20 -right-14 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center text-white shadow-inner">
                <Icon name={config.icon} size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.15em]">{t(config.titleKey)}</p>
                <h1 className="text-lg sm:text-2xl font-extrabold text-white truncate">{title}</h1>
                {subtitle && <p className="text-white/70 text-[11px] font-medium truncate">{subtitle}</p>}
              </div>
            </div>

            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>

        {/* Floating pill nav, docked over the hero card */}
        <div className="relative z-20 -mt-5 px-1">
          <nav className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/5 dark:shadow-black/30 border border-slate-200/80 dark:border-slate-800 p-1.5">
            {config.nav.map((item, idx) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  className={`relative shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} text-white shadow-md`
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name={item.icon} size={14} />
                  <span>{t(item.labelKey)}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <main className="page-shell pt-6 pb-8 sm:pb-10 space-y-6">{children}</main>
    </div>
  );
}
