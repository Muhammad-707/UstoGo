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
        'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200',
        active
          ? cn('bg-slate-900/[0.04] font-semibold text-slate-900 dark:bg-white/[0.07] dark:text-white')
          : 'text-slate-500 hover:bg-slate-900/[0.03] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100',
      )}
    >
      {/* Active state is a soft neutral pill plus a coloured glyph. The old version
          bolted a gradient bar to the left edge of every active row, which is the kind
          of chrome that dates an interface faster than anything else in it. */}
      <item.Icon
        size={17}
        strokeWidth={1.75}
        className={cn(
          'shrink-0 transition-colors',
          active
            ? config.navIcon
            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300',
        )}
      />
      <span className="truncate">{label}</span>
      {item.badge ? (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white">
          {item.badge}
        </span>
      ) : item.external ? (
        <ArrowUpRight
          size={13}
          className="ml-auto shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600"
        />
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
        <div key={group.groupKey} className="space-y-0.5">
          <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
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
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
          config.gradientFrom,
          config.gradientTo,
          config.glow,
        )}
      >
        <config.Icon size={18} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          UstoGo
        </p>
        <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{label}</p>
      </div>
    </div>
  );
}

/**
 * Sidebar + content column. Everything the cabinet's chrome is, minus the page title.
 *
 * The rail follows the theme rather than fighting it, and it is deliberately quiet:
 * medium-weight labels, a soft neutral pill on the active row, and the role accent
 * (amber for a master, blue for a client, violet for admin) spent only on the active
 * glyph and the brand mark. Everything louder than that — the gradient bar, the
 * letter-spaced capitals, the drop shadow — was chrome competing with the data.
 *
 * `DashboardLayout` adds a title header on top of this; `/settings/*` uses the shell
 * directly and keeps its own `PageHeader`.
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

  const rail = (
    <>
      <div className="sticky top-0 z-10 bg-white/90 px-4 pb-4 pt-5 backdrop-blur dark:bg-slate-900/90">
        <PanelBadge config={config} label={t(config.titleKey)} />
      </div>
      <div className="px-2.5 pb-5">
        <NavGroups groups={groups} config={config} pathname={pathname} t={t} />
      </div>
    </>
  );

  return (
    <InsideShellContext.Provider value={true}>
      {/* No background of its own on purpose. The cabinet used to paint a flat #FAFAFA
          over the site's own tinted backdrop, which is the single biggest reason signing
          in felt like leaving the product: the public pages sit on a soft blue wash and
          the cabinet sat on grey. Transparent lets the same wash through. */}
      <div className="min-h-screen">
        <div className="page-shell flex gap-6 py-6 sm:py-8">

          {/* Sidebar (desktop).
              `max-h` + `overflow-y-auto`: the admin nav is fourteen items in four
              groups, taller than most laptop viewports. A plain sticky block simply cut
              the last group off — the Marketplace section was unreachable because the
              page behind it had already stopped scrolling. */}
          <aside className="hidden w-[248px] shrink-0 lg:block">
            <div className="no-scrollbar sticky top-[88px] max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain rounded-[28px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:shadow-none dark:ring-white/[0.07]">
              <div className="relative">
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -top-16 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl dark:opacity-25',
                    config.aura,
                  )}
                />
                <div className="relative">{rail}</div>
              </div>
            </div>
          </aside>

          <div className="in-cabinet min-w-0 flex-1 space-y-5">
            {renderMenuButton ? (
              renderMenuButton(() => setMobileOpen(true))
            ) : (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={t('navMenu')}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <div className="animate-fade-in no-scrollbar absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white pb-safe shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
              <button
                type="button"
                aria-label={t('closeMenu')}
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={16} />
              </button>
              <div className="relative">
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -top-16 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl dark:opacity-25',
                    config.aura,
                  )}
                />
                <div className="relative">
                  <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-4 pt-5 backdrop-blur">
                    <PanelBadge config={config} label={t(config.titleKey)} />
                  </div>
                  <div className="px-2.5 pb-5">
                    <NavGroups
                      groups={groups}
                      config={config}
                      pathname={pathname}
                      t={t}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </InsideShellContext.Provider>
  );
}
