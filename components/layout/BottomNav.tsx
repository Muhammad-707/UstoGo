'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  /** The raised centre action — one per bar, and only where there is one obvious next step. */
  primary?: boolean;
}

/**
 * The phone's navigation: a fixed bar at the thumb, not a menu behind a hamburger.
 *
 * This component existed and was never mounted, so on a phone the entire product was
 * reachable only through the drawer in the header — three taps to the search page, and
 * nothing on screen to say where you were. It is mounted now, it knows which cabinet the
 * signed-in person belongs to, and it sits above the home indicator rather than under it.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('common');
  const { user } = useAuth();

  const items = useMemo<NavItem[]>(() => {
    if (user?.role === 'MASTER') {
      return [
        { href: '/dashboard/master', icon: 'Grid', label: t('navCabinet') },
        { href: '/settings/schedule', icon: 'Calendar', label: t('navSchedule') },
        { href: '/messages', icon: 'whatsapp', label: t('navMessages') },
        { href: '/settings/profile', icon: 'User', label: t('navProfile') },
      ];
    }
    if (user?.role === 'ADMIN') {
      return [
        { href: '/dashboard/admin', icon: 'Grid', label: t('navCabinet') },
        { href: '/dashboard/admin/bookings', icon: 'Calendar', label: t('navBookings') },
        { href: '/dashboard/admin/users', icon: 'Users', label: t('navUsers') },
        { href: '/settings/profile', icon: 'User', label: t('navProfile') },
      ];
    }
    // Clients, and guests — who are shown the client's chrome, because that is who the
    // signup funnel is for.
    return [
      { href: '/home', icon: 'Home', label: t('navFeed') },
      { href: '/search', icon: 'Search', label: t('navSearch') },
      { href: '/booking', icon: 'plus', label: t('bookShort'), primary: true },
      { href: '/marketplace', icon: 'shoppingbag', label: t('navShop') },
      { href: user ? '/dashboard/client' : '/auth/login', icon: 'User', label: t('navProfile') },
    ];
  }, [user, t]);

  /**
   * `/booking` must not light up `/booking/[id]`'s row and vice versa, and `/dashboard`
   * prefixes overlap by design, so the match is exact-or-child rather than `startsWith`.
   */
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // The landing page is a sales page and the auth screens are a funnel; neither wants a
  // navigation bar across the bottom of it.
  if (pathname === '/' || pathname.startsWith('/auth')) return null;

  return (
    <>
      {/* Reserves the bar's own height at the end of the document, so the last row of
          every page clears it instead of hiding underneath. */}
      <div aria-hidden className="h-bottom-nav lg:hidden" />

      <nav
        aria-label={t('navBarLabel')}
        // `z-40`, under the z-50 layer: dialogs, the cabinet's slide-over nav and the
        // header's drawer all have to cover this bar, not appear beneath it.
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/85 pb-safe backdrop-blur-xl lg:hidden dark:border-slate-800/80 dark:bg-slate-900/85"
      >
        <div className="mx-auto flex h-[4.25rem] max-w-lg items-stretch justify-around px-1.5">
          {items.map((item) => {
            const active = isActive(item.href);

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="tap-press relative -mt-5 flex w-[4.5rem] flex-col items-center justify-start gap-1 pt-0"
                >
                  {/* The one action the whole product is for, raised out of the bar. */}
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/35 ring-4 ring-white dark:ring-slate-900">
                    <Icon name={item.icon} size={22} className="stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-sky-400">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="tap-press relative flex w-[4.5rem] flex-col items-center justify-center gap-1"
              >
                <span className="relative flex h-8 w-12 items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 rounded-full bg-blue-100 dark:bg-sky-500/15"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon
                    name={item.icon}
                    size={20}
                    className={cn(
                      'relative z-10 transition-colors duration-200',
                      active
                        ? 'stroke-[2.5] text-blue-600 dark:text-sky-400'
                        : 'text-slate-500 dark:text-slate-400',
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'w-full truncate px-0.5 text-center text-[10px] font-bold transition-colors duration-200',
                    active ? 'text-blue-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
