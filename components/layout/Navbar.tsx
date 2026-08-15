'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { setLocale } from '@/i18n/actions';
import { locales, localeMeta, type Locale } from '@/i18n/locales';
import { useAuth, dashboardPathFor } from '@/contexts/AuthContext';
import { cartApi, notificationsApi } from '@/lib/api/endpoints';
import { resolveOwnFileUrl } from '@/lib/api/upload';
import { NOTIFICATION_TYPES, type NotificationItem } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/** The icon cluster buttons all share this shape — one place to change their feel. */
const clusterButton =
  'h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLocale() as Locale;
  const t = useTranslations('common');
  const tn = useTranslations('notificationTypes');
  const [, startTransition] = useTransition();
  const setLang = (l: Locale) => {
    startTransition(() => {
      setLocale(l).then(() => router.refresh());
    });
  };
  const { user, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  /** Clock for the relative timestamps, ticked once a minute so "5 дақ пеш" stays true. */
  const [now, setNow] = useState<number | null>(null);

  const avatarFileId = user?.masterProfile?.avatarFileId ?? user?.clientProfile?.avatarFileId ?? null;

  useEffect(() => {
    if (!avatarFileId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- drops a stale photo on logout or removal
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    resolveOwnFileUrl(avatarFileId)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [avatarFileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the clock once the component is on the client
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale notifications on logout
      setNotifications([]);
      setUnreadCount(0);
      setCartCount(0);
      return;
    }
    notificationsApi.unreadCount().then((res) => setUnreadCount(res.count)).catch(() => {});
    notificationsApi.list({ limit: 5 }).then((res) => setNotifications(res.items)).catch(() => {});
    if (user.role === 'CLIENT') {
      cartApi.get().then((cart) => setCartCount(cart.items.length)).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ustogo-theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrates theme from localStorage (unavailable during SSR)
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ustogo-theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ustogo-theme', 'dark');
      setDarkMode(true);
    }
  };

  /** A guest is shown the client's chrome — that is who the signup funnel is for. */
  const isClientView = !user || user.role === 'CLIENT';

  /** `tj` is not a language tag (Tajik is `tg`), so dates need the mapped one. */
  const intlLocale = ({ tj: 'tg-TJ', ru: 'ru-RU', en: 'en-US' } as Record<string, string>)[lang] ?? 'en-US';

  const notificationTitle = (type: string): string => {
    const known = (NOTIFICATION_TYPES as readonly string[]).includes(type);
    return known ? tn(type) : tn('fallback');
  };

  /**
   * Icon *and* colour per family.
   *
   * Every row used to be the same blue clock, so a cancelled booking, a new review and
   * a payment confirmation were visually identical and the list read as one repeated
   * item. The colour is what lets the eye sort the list before reading a word of it.
   */
  const notificationLook = (type: string): { icon: string; chip: string } => {
    if (type.endsWith('_CANCELLED') || type.endsWith('_REJECTED') || type.endsWith('_EXPIRED') || type.endsWith('_DECLINED')) {
      return { icon: 'X', chip: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' };
    }
    if (type.endsWith('_COMPLETED') || type.endsWith('_ACCEPTED') || type.endsWith('_APPROVED') || type === 'PAYMENT_CONFIRMED') {
      return { icon: 'CheckCircle2', chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' };
    }
    if (type.startsWith('REVIEW')) {
      return { icon: 'Star', chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' };
    }
    if (type.startsWith('QUOTE')) {
      return { icon: 'FileText', chip: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400' };
    }
    if (type === 'MESSAGE_RECEIVED') {
      return { icon: 'MessageSquare', chip: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' };
    }
    if (type === 'ORDER_PLACED') {
      return { icon: 'shoppingbag', chip: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400' };
    }
    if (type.startsWith('BOOKING')) {
      return { icon: 'Clock', chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-sky-400' };
    }
    return { icon: 'Bell', chip: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
  };

  /**
   * "3 дақ пеш" rather than "10.08.2026, 17:28:48".
   *
   * A notification list is read to find out what just happened; a full timestamp to the
   * second answers a question nobody asked and pushed the actual message off the row.
   *
   * Built from the catalogue rather than `Intl.RelativeTimeFormat` for the same reason
   * the weekdays are: `tj` is not a language tag, and even `tg` is missing from most
   * CLDR builds, so the formatter silently answered a Tajik interface in Russian.
   */
  const relativeTime = (iso: string): string => {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    // Before `now` is set — server render and first paint — fall back to the date, so
    // the markup the server sent matches what the client renders over it.
    if (now === null) return new Date(iso).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' });
    const mins = Math.round((now - then) / 60_000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return t('timeMinutesAgo', { count: mins });
    const hours = Math.round(mins / 60);
    if (hours < 24) return t('timeHoursAgo', { count: hours });
    const days = Math.round(hours / 24);
    if (days < 30) return t('timeDaysAgo', { count: days });
    return new Date(iso).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' });
  };

  /** Where a notification should take you — a bell you cannot click through is a dead end. */
  const notificationHref = (n: NotificationItem): string => {
    const bookingId = (n.payload?.bookingId as string) || '';
    if (n.type.startsWith('BOOKING') && bookingId) return `/booking/${bookingId}`;
    if (n.type.startsWith('QUOTE')) return '/quotes';
    if (n.type.startsWith('REVIEW')) return '/reviews';
    if (n.type === 'MESSAGE_RECEIVED') return '/messages';
    if (n.type === 'ORDER_PLACED') return '/orders';
    if (n.type === 'PAYMENT_CONFIRMED') return '/payments';
    return '/notifications';
  };

  /**
   * Six links, deliberately. The landing page is reachable by clicking the wordmark —
   * a nav item pointing at the same place was one more thing to read for nothing — and
   * the leaderboard now lives as a tab inside `/reviews`, which is the same subject.
   * Every label is `whitespace-nowrap`: a two-line link grows the bar past its own
   * height and the page below then starts underneath it.
   */
  const navLinks = [
    { href: '/home', label: t('home') },
    { href: '/categories', label: t('categories') },
    { href: '/search', label: t('searchMasters') },
    { href: '/marketplace', label: t('marketplace') },
    { href: '/reviews', label: t('reviews') },
    { href: '/about', label: t('about') },
  ];

  const languages: Array<{ code: Locale; flag: string; label: string }> = locales.map((code) => ({
    code,
    ...localeMeta[code],
  }));

  const currentLangObj = languages.find((l) => l.code === lang) || languages[2];

  const isLinkActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /**
   * The booking CTA rests as an icon and opens into its label on hover.
   *
   * The width is measured rather than guessed. A `max-width` transition has to pick a
   * number big enough for the longest translation, so the easing finishes well before
   * the box reaches it and the tail of the movement snaps; the CSS `0fr → 1fr` grid
   * trick collapses here for a different reason — an `fr` needs free space to divide,
   * and inside a shrink-to-fit `inline-flex` there is none, so it resolves to 0. The
   * label's own `offsetWidth` is neither of those problems, and it is re-read whenever
   * the label changes, which is what makes this survive a language switch — and now
   * also whenever the font finishes loading, because the first measurement is taken
   * against the fallback face and comes out several pixels short, which is exactly the
   * clip you see on the last letter of the label.
   */
  const bookLabel = t('bookService');
  const bookLabelRef = useRef<HTMLSpanElement>(null);
  const [bookLabelWidth, setBookLabelWidth] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (bookLabelRef.current) setBookLabelWidth(bookLabelRef.current.offsetWidth);
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
  }, [bookLabel]);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors duration-300">
      {/* `page-shell` on purpose: it is the one container the whole site uses, so the
          wordmark, the page header band below and the page content share a left edge. */}
      <div className="page-shell h-[72px] flex items-center justify-between gap-4">

        {/* Brand Logo — also the link to the landing page */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <Icon name="Wrench" size={21} className="stroke-[2.5]" />
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[22px] font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
                Usto<span className="text-blue-600 dark:text-sky-400">Go</span>
              </span>
              <span className="hidden sm:inline px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 hidden 2xl:block whitespace-nowrap">
              {t('brandSub')}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className={cn(
                  'h-auto px-3 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950/60'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
                )}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Icon cluster: notifications, cart, theme — one surface instead of three */}
          <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60">
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(clusterButton, 'relative')} aria-label={t('notificationsTitle')}>
                    <Icon name="Bell" size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-slate-800">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={12} className="w-[22rem] overflow-hidden rounded-2xl p-0 sm:w-[25rem]">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200/70 dark:bg-blue-500/10 dark:text-sky-400 dark:ring-sky-500/20">
                        <Icon name="Bell" size={15} />
                      </span>
                      <div>
                        <h4 className="text-[13px] font-extrabold leading-tight text-slate-900 dark:text-white">
                          {t('notificationsTitle')}
                        </h4>
                        {unreadCount > 0 && (
                          <p className="text-[10px] font-bold text-blue-600 dark:text-sky-400">
                            {t('unreadCount', { count: unreadCount })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/notifications"
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-extrabold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {t('viewAll')}
                    </Link>
                  </div>

                  <ScrollArea className="max-h-[22rem]">
                    <div className="p-2">
                      {notifications.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-10">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <Icon name="Bell" size={20} />
                          </span>
                          <p className="text-xs font-semibold text-slate-400">{tn('empty')}</p>
                        </div>
                      )}
                      {notifications.map((n) => {
                        // Only a few notification types carry a prebuilt title/message in
                        // their payload; the rest arrived as a bare timestamp with two
                        // empty lines above it. The type itself is always present and is
                        // enough to say what happened, in the reader's own language.
                        const title = (n.payload?.title as string) || notificationTitle(n.type);
                        // A bare "Фармоиши нав" five times over says nothing about *which*
                        // job. Whatever the payload does carry — the service, the booking
                        // number, the other party — is the line that makes the row useful.
                        const message =
                          (n.payload?.message as string) ||
                          [
                            n.payload?.serviceTitle as string | undefined,
                            n.payload?.clientName as string | undefined,
                            n.payload?.masterDisplayName as string | undefined,
                            n.payload?.bookingNumber ? `#${n.payload.bookingNumber}` : undefined,
                          ]
                            .filter(Boolean)
                            .join(' · ');
                        const look = notificationLook(n.type);

                        return (
                          <Link
                            key={n.id}
                            href={notificationHref(n)}
                            className={cn(
                              'group relative flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors',
                              n.isRead
                                ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                : 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-500/[0.07] dark:hover:bg-blue-500/10',
                            )}
                          >
                            {!n.isRead && (
                              <span
                                aria-hidden
                                className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-blue-500"
                              />
                            )}
                            <span
                              className={cn(
                                'mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]',
                                look.chip,
                              )}
                            >
                              <Icon name={look.icon} size={16} />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <p
                                  className={cn(
                                    'min-w-0 flex-1 truncate text-[13px] leading-snug',
                                    n.isRead
                                      ? 'font-semibold text-slate-700 dark:text-slate-300'
                                      : 'font-extrabold text-slate-900 dark:text-white',
                                  )}
                                >
                                  {title}
                                </p>
                                <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-400">
                                  {relativeTime(n.createdAt)}
                                </span>
                              </div>
                              {message && (
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                  {message}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}

            {user?.role === 'CLIENT' && (
              <Button asChild variant="ghost" size="icon" className={cn(clusterButton, 'relative')} aria-label={t('cart')}>
                <Link href="/cart">
                  <Icon name="shoppingcart" size={17} />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-slate-800">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={clusterButton}
              title={t('toggleThemeTooltip')}
              aria-label={t('toggleThemeTooltip')}
            >
              {darkMode ? <Icon name="Sun" size={17} className="text-amber-400" /> : <Icon name="Moon" size={17} />}
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-1 px-2 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 [&[data-state=open]>svg]:rotate-180"
                  title={t('selectLanguage')}
                >
                  <span>{currentLangObj.flag}</span>
                  <span className="hidden 2xl:inline">{currentLangObj.label}</span>
                  <Icon name="ChevronDown" size={13} className="transition-transform" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="w-40 rounded-2xl p-2">
                {languages.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={() => setLang(l.code)}
                    className={cn(
                      'gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer',
                      lang === l.code && 'bg-blue-600 text-white focus:bg-blue-600 focus:text-white',
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Profile / Login */}
          {user ? (
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto gap-2 pl-1.5 pr-2.5 py-1.5 rounded-2xl border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 [&[data-state=open]>svg]:rotate-180"
                  >
                    {/* The account chip showed an initial even for people who had
                        uploaded a photo — the file id was on the profile the whole time,
                        it was simply never resolved here. */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                        {(user.masterProfile?.displayName || user.clientProfile?.firstName || user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                    <span className="hidden lg:inline max-w-[110px] truncate">
                      {user.masterProfile?.displayName || user.clientProfile?.firstName || user.email}
                    </span>
                    <Icon name="ChevronDown" size={13} className="transition-transform" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-52 rounded-2xl p-2">
                  <DropdownMenuItem asChild className="px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer">
                    <Link href={dashboardPathFor(user.role)} className="gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-sky-400 flex items-center justify-center">
                        <Icon name="User" size={15} />
                      </div>
                      {t('myDashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={handleLogout}
                    className="gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
                      <Icon name="LogOut" size={15} />
                    </div>
                    {t('logOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            !loading && (
              <Button
                asChild
                variant="outline"
                className="hidden sm:inline-flex h-auto px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Link href="/auth/login">{t('logIn')}</Link>
              </Button>
            )
          )}

          {/* Booking is a client action: a master fulfils jobs and an admin moderates
              them, so neither has any use for "book a service" in their own header.

              It rests as an icon and opens into the full label on hover — see the
              `bookLabelWidth` note above for why the width is measured. At rest it was
              the widest thing in the bar for a control nobody needs to read twice.
              `title`/`aria-label` carry the same words for anyone not using a mouse, and
              focus opens it too so the keyboard path is not icon-only. */}
          {isClientView && (
            <Button
              asChild
              className="group relative hidden h-11 items-center gap-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 p-1.5 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-600/40 md:inline-flex"
            >
              <Link
                href="/booking"
                title={bookLabel}
                aria-label={bookLabel}
                onMouseEnter={() => setBookOpen(true)}
                onMouseLeave={() => setBookOpen(false)}
                onFocus={() => setBookOpen(true)}
                onBlur={() => setBookOpen(false)}
              >
                {/* A light sweeping across the pill on hover — the one flourish that
                    makes the opening read as deliberate rather than as a reflow. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
                />

                {/* The glyph sits on its own tile, so the resting state is a square
                    icon button rather than a wide pill with a lonely icon in it. */}
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-colors duration-300 group-hover:bg-white/25">
                  <Icon name="Calendar" size={16} />
                </span>

                {/* Spring, not a linear ease: the label used to arrive at full width and
                    stop dead. A spring settles into it, which is what "smooth" actually
                    looks like at this size. Opacity leads slightly so the text is legible
                    before the box has finished growing. */}
                <motion.span
                  className="relative z-10 overflow-hidden whitespace-nowrap"
                  initial={false}
                  animate={{ width: bookOpen ? bookLabelWidth : 0, opacity: bookOpen ? 1 : 0 }}
                  transition={{
                    width: { type: 'spring', stiffness: 260, damping: 30, mass: 0.7 },
                    opacity: { duration: 0.2, ease: 'easeOut' },
                  }}
                >
                  <span ref={bookLabelRef} className="inline-block pl-2.5 pr-2">
                    {bookLabel}
                  </span>
                </motion.span>
              </Link>
            </Button>
          )}

          {/* Mobile Navigation Drawer */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 xl:hidden"
                aria-label="Menu"
              >
                <Icon name="Menu" size={21} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm p-0 xl:hidden">
              <SheetHeader className="border-b border-slate-200 dark:border-slate-800">
                <SheetTitle className="flex items-center gap-2 text-base font-extrabold">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white">
                    <Icon name="Wrench" size={16} className="stroke-[2.5]" />
                  </span>
                  Usto<span className="-ml-2 text-blue-600 dark:text-sky-400">Go</span>
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="px-4 py-5 space-y-2">
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(
                      'w-full h-auto justify-start px-4 py-3 rounded-xl text-sm font-semibold',
                      pathname === '/'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/">{t('landing')}</Link>
                  </Button>
                  {navLinks.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant="ghost"
                      className={cn(
                        'w-full h-auto justify-start px-4 py-3 rounded-xl text-sm font-semibold',
                        isLinkActive(link.href)
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50',
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}

                  <Separator className="my-3" />

                  {isClientView && (
                    <Button
                      asChild
                      className="md:hidden w-full h-auto justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/25"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/booking">
                        <Icon name="Calendar" size={16} />
                        {t('bookService')}
                      </Link>
                    </Button>
                  )}
                  {user ? (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full h-auto justify-start gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href={dashboardPathFor(user.role)}>{t('myDashboard')}</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full h-auto justify-start gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        {t('logOut')}
                      </Button>
                    </>
                  ) : (
                    !loading && (
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full h-auto justify-start gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/auth/login">{t('logIn')}</Link>
                      </Button>
                    )
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
};
