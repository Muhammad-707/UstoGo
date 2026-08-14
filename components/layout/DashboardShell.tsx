'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Menu, X } from 'lucide-react';

import { getSidebarConfig, groupNav, type NavItem, type SidebarConfig } from '@/lib/dashboardNav';
import { cn } from '@/lib/utils';

/**
 * True for anything rendered inside the cabinet's sidebar layout.
 *
 * `PageHeader` reads it to drop its full-bleed band: the band carries its own
 * `page-shell`, which inside the shell's content column produced a second container
 * inside the first — a header indented twice and misaligned with the content under it.
 */
const InsideShellContext = createContext(false);

export function useInsideDashboardShell(): boolean {
  return useContext(InsideShellContext);
}

function isActiveHref(pathname: string, href: string): boolean {
  // `/dashboard/admin` must not light up on `/dashboard/admin/users`, but
  // `/dashboard/admin/marketplace/products` must light up on its own detail routes.
  if (href === '/dashboard/admin' || href === '/dashboard/master' || href === '/dashboard/client') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + '/');
}

/**
 * Declared at module scope, not inside the shell.
 *
 * A component defined in a render body is a *new component type* on every render, so
 * React unmounts and remounts the whole nav each time the parent re-renders — losing
 * focus, restarting transitions, and re-running any effect a child holds.
 */
function NavLink({
  item,
  active,
  config,
  label,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  config: SidebarConfig;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors',
        active
          ? cn(config.activeBg, config.activeText)
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
      )}
    >
      {active && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-1.5 left-0 w-1 rounded-full bg-gradient-to-b',
            config.gradientFrom,
            config.gradientTo
          )}
        />
      )}
      <item.Icon size={16} className="shrink-0" strokeWidth={active ? 2.4 : 2} />
      <span className="truncate">{label}</span>
      {item.badge ? (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
          {item.badge}
        </span>
      ) : item.external ? (
        <ArrowUpRight size={13} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-40" />
      ) : null}
    </Link>
  );
}

function NavGroups({
  groups,
  config,
  pathname,
  t,
  onNavigate,
}: {
  groups: { groupKey: string; items: NavItem[] }[];
  config: SidebarConfig;
  pathname: string;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.groupKey} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            {t(group.groupKey)}
          </p>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActiveHref(pathname, item.href)}
              config={config}
              label={t(item.labelKey)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function PanelBadge({ config, label }: { config: SidebarConfig; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
          config.gradientFrom,
          config.gradientTo,
          config.glow
        )}
      >
        <config.Icon size={19} strokeWidth={2.2} />
      </span>
      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

/**
 * Sidebar + content column. Everything the cabinet's chrome is, minus the page title.
 *
 * `DashboardLayout` adds a title header on top of this; `/settings/*` uses the shell
 * directly and keeps its own `PageHeader`. Before this split the settings screens had
 * no sidebar at all — a master who opened "Services" lost every way back into their
 * cabinet except the browser's back button.
 *
 * `menuSlot` lets the caller place the mobile menu button in its own header row rather
 * than have the shell render a second one.
 */
export function DashboardShell({
  role,
  children,
  renderMenuButton,
}: {
  role: string;
  children: React.ReactNode;
  /** Given a click handler, returns the mobile menu trigger. Omit for the default. */
  renderMenuButton?: (open: () => void) => React.ReactNode;
}) {
  const t = useTranslations('dashboardLayout');
  const pathname = usePathname();
  const config = getSidebarConfig(role);
  const groups = groupNav(config.nav);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <InsideShellContext.Provider value={true}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="page-shell flex gap-8 py-6 sm:py-8">

          {/* Sidebar (desktop).
              `max-h` + `overflow-y-auto`: the admin nav is fourteen items in four
              groups, taller than most laptop viewports. A plain sticky block simply cut
              the last group off — the Marketplace section was unreachable because the
              page behind it had already stopped scrolling. */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="no-scrollbar sticky top-[88px] max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* Sticky *inside* the scroller: the panel badge is what tells you whose
                  cabinet you are in, and scrolling to the Marketplace group used to
                  take it off screen. Opaque background, or the nav scrolls under it. */}
              <div className="sticky top-0 z-10 bg-white px-5 pb-3 pt-5 dark:bg-slate-900">
                <PanelBadge config={config} label={t(config.titleKey)} />
              </div>
              <div className="px-4 pb-4">
                <NavGroups groups={groups} config={config} pathname={pathname} t={t} />
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            {renderMenuButton ? (
              renderMenuButton(() => setMobileOpen(true))
            ) : (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={t('navMenu')}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <Menu size={18} />
              </button>
            )}

            {children}
          </div>
        </div>

        {/* Slide-over nav (mobile) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label={t('closeMenu')}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <div className="animate-fade-in absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between gap-3 px-1">
                <PanelBadge config={config} label={t(config.titleKey)} />
                <button
                  type="button"
                  aria-label={t('closeMenu')}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <NavGroups
                groups={groups}
                config={config}
                pathname={pathname}
                t={t}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </InsideShellContext.Provider>
  );
}
