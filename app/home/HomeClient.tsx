'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Clock,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';

import { useMoney } from '@/lib/money';
import { bookingsApi } from '@/lib/api/endpoints';
import type { Category, MasterPublic, Booking } from '@/lib/api/types';
import { getCategoryVisual } from '@/lib/categoryVisuals';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';
import { useAuth } from '@/contexts/AuthContext';
import { useDateFormat } from '@/lib/datetime';
import { cn } from '@/lib/utils';

import { CategoryCard } from '@/components/categories/CategoryCard';
import { RecommendedProducts } from '@/components/marketplace/RecommendedProducts';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

/** Bright, finished interior — the outcome the feed is selling, not a tool close-up. */
const WELCOME_IMAGE =
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80';

function flattenLeafCategories(categories: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (list: Category[]) => {
    for (const c of list) {
      if (c.isLeaf) out.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(categories);
  return out;
}

interface QuickAction {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  tile: string;
}

export default function ClientHomePage({
  categories,
  topMasters,
  allMasters,
}: {
  categories: Category[];
  topMasters: MasterPublic[];
  allMasters: MasterPublic[];
}) {
  const t = useTranslations('common');
  const tCategories = useTranslations('categories');
  const te = useTranslations('enums');
  const fmt = useDateFormat();
  const { perHour } = useMoney();
  const { user } = useAuth();

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const leafCategories = useMemo(() => flattenLeafCategories(categories), [categories]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number | null }>();
    for (const m of allMasters) {
      const price = m.priceFrom ? Number(m.priceFrom) : null;
      for (const name of m.categories) {
        const stat = map.get(name) ?? { count: 0, minPrice: null };
        stat.count += 1;
        if (price !== null && (stat.minPrice === null || price < stat.minPrice)) stat.minPrice = price;
        map.set(name, stat);
      }
    }
    return map;
  }, [allMasters]);

  const topCategories = useMemo(() => {
    return [...leafCategories]
      .sort((a, b) => (categoryStats.get(b.name)?.count ?? 0) - (categoryStats.get(a.name)?.count ?? 0))
      .slice(0, 8);
  }, [leafCategories, categoryStats]);

  /**
   * Five categories for the bento, biased to the ones whose photograph carries a whole
   * finished room — a shot of a drill bit set does not sell "see your home differently"
   * the way a finished kitchen does. Anything missing falls back to the top categories,
   * so the section still fills out on a catalogue that does not have these slugs.
   */
  const inspirationTiles = useMemo(() => {
    const preferred = ['interior-design', 'masonry', 'painting', 'roofing', 'cleaning'];
    const bySlug = new Map(leafCategories.map((c) => [c.slug, c]));
    const picked: Category[] = [];
    const seen = new Set<string>();
    for (const slug of preferred) {
      const cat = bySlug.get(slug);
      if (cat && !seen.has(cat.id)) {
        picked.push(cat);
        seen.add(cat.id);
      }
    }
    for (const cat of topCategories) {
      if (picked.length >= 5) break;
      if (!seen.has(cat.id)) {
        picked.push(cat);
        seen.add(cat.id);
      }
    }
    return picked.slice(0, 5);
  }, [leafCategories, topCategories]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale booking on logout
      setActiveBooking(null);
      return;
    }
    bookingsApi
      .list({ status: 'IN_PROGRESS', limit: 1 })
      .then((res) => setActiveBooking(res.items[0] ?? null))
      .catch(() => setActiveBooking(null));
  }, [user]);

  /** A master browsing the feed has no clientProfile, which is how a signed-in user
      ended up greeted as "Guest" — and "Guest" was hardcoded English besides. */
  const greetingName = user?.clientProfile?.firstName ?? user?.masterProfile?.displayName ?? null;

  const QUICK_ACTIONS: QuickAction[] = [
    {
      href: '/search',
      label: t('searchMasters'),
      description: t('quickSearchDesc'),
      Icon: Search,
      tile: 'from-blue-600 to-sky-500 shadow-blue-500/25',
    },
    {
      href: '/booking',
      label: t('bookService'),
      description: t('quickBookDesc'),
      Icon: CalendarCheck,
      tile: 'from-violet-600 to-fuchsia-500 shadow-violet-500/25',
    },
    {
      href: '/marketplace',
      label: t('marketplace'),
      description: t('quickMarketDesc'),
      Icon: ShoppingBag,
      tile: 'from-emerald-600 to-teal-500 shadow-emerald-500/25',
    },
    {
      href: '/orders',
      label: t('myOrders'),
      description: t('quickOrdersDesc'),
      Icon: Package,
      tile: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    },
  ];

  return (
    <div className="page-shell space-y-12 py-10">

      {/* 1. WELCOME — copy left, photograph filling the right half of the same panel. */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <img src={WELCOME_IMAGE} alt="" className="h-full w-full object-cover" />
          {/* Feathered into the panel so the photo reads as part of the card, not a patch. */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/20" />
        </div>
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="relative flex flex-col gap-8 p-8 sm:p-10 lg:max-w-[58%]">
          <div className="space-y-3">
            <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-200">
              {t('clientDashboard')}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {greetingName ? t('greetingAfternoon', { name: greetingName }) : t('welcome')}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-300">{t('homeSubheading')}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <Search size={16} />
              <span>{t('searchMasters')}</span>
            </Link>
            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <CalendarCheck size={16} />
              <span>{t('bookService')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. ACTIVE BOOKING */}
      {activeBooking && (
        <section className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md dark:border-blue-900/60 dark:from-blue-950/50 dark:to-slate-900">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-500/40" />
                <Clock size={22} className="relative" />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-blue-700 dark:text-sky-300">
                    {t('activeBookingPrefix')}
                    {activeBooking.bookingNumber}
                  </span>
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {te(`bookingStatus.${activeBooking.status}`)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeBooking.serviceTitle} {t('withConnector')} {activeBooking.masterDisplayName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('scheduledForPrefix')} {fmt.dateTime(activeBooking.scheduledAt)}
                </p>
              </div>
            </div>

            <Link
              href={`/booking/${activeBooking.id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 sm:w-auto"
            >
              <MapPin size={14} />
              <span>{t('viewTracker')}</span>
            </Link>
          </div>
        </section>
      )}

      {/* 3. QUICK ACTIONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('quickActions')}</h2>

        <FilterContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <FilterItem key={a.href} className="h-full">
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} className="h-full">
                <Link
                  href={a.href}
                  className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-blue-200 hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900/80"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
                        a.tile
                      )}
                    >
                      <a.Icon size={20} strokeWidth={2.2} />
                    </span>
                    <ArrowUpRight
                      size={16}
                      className="translate-y-1 text-slate-300 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:text-slate-600"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-sky-400">
                      {a.label}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {a.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </section>

      {/* 4. INSPIRATION — a bento of finished rooms, each one a live doorway into the
             category that produced it. The marketing numbers that used to sit here
             belong on the landing page: a reader who has already signed in does not
             need to be sold the platform again, they need something to look at and a
             way in. Every tile is a real category with real masters behind it. */}
      {inspirationTiles.length >= 5 && (
        <section className="space-y-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              <Sparkles size={13} />
              {t('inspirationBadge')}
            </span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('inspirationTitle')}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('inspirationSub')}</p>
          </div>

          <FilterContainer className="grid auto-rows-[168px] grid-cols-2 gap-4 lg:grid-cols-4">
            {inspirationTiles.map((tile, idx) => {
              const visual = getCategoryVisual(tile.slug);
              const stat = categoryStats.get(tile.name);
              // First tile takes a 2×2 block on desktop; the rest fill in around it.
              const wide = idx === 0;
              return (
                <FilterItem
                  key={tile.id}
                  className={cn('h-full', wide && 'col-span-2 row-span-2')}
                >
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="h-full"
                  >
                    <Link
                      href={`/search?category=${tile.id}`}
                      className="group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_28px_56px_-28px_rgba(15,23,42,0.45)]"
                    >
                      <img
                        src={visual.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                      />
                      {/* Two stops, not one: a flat 50% scrim greys the photo out, while a
                          bottom-weighted gradient keeps the image bright and still gives
                          the caption something solid to sit on. */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                      <span className="absolute right-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/95 text-slate-800 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <ArrowUpRight size={17} strokeWidth={2.5} />
                      </span>

                      <div className="relative p-5">
                        <h3
                          className={cn(
                            'font-extrabold tracking-tight text-white',
                            wide ? 'text-2xl' : 'text-base'
                          )}
                        >
                          {tile.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
                          <ShieldCheck size={12} />
                          {tCategories('verifiedMasters', { count: stat?.count ?? 0 })}
                          {stat?.minPrice != null && (
                            <>
                              <span className="opacity-40">·</span>
                              {tCategories('startingFrom', { price: perHour(stat.minPrice) })}
                            </>
                          )}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                </FilterItem>
              );
            })}
          </FilterContainer>
        </section>
      )}

      {/* 5. CATEGORIES */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('topCategories')}</h2>
          <Link
            href="/categories"
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition hover:gap-2 dark:text-sky-400"
          >
            {t('allServices')} ({leafCategories.length})
            <ArrowRight size={14} />
          </Link>
        </div>

        <FilterContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topCategories.map((cat) => {
            const stat = categoryStats.get(cat.name);
            return (
              <FilterItem key={cat.id} className="h-full">
                <CategoryCard
                  variant="compact"
                  category={cat}
                  mastersCount={stat?.count ?? 0}
                  mastersLabel={tCategories('verifiedMasters', { count: stat?.count ?? 0 })}
                  priceLabel={stat?.minPrice != null ? tCategories('startingFrom', { price: perHour(stat.minPrice) }) : null}
                />
              </FilterItem>
            );
          })}
        </FilterContainer>
      </section>

      {/* 6. TOP MASTERS */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('topRatedCraftsmen')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('topRatedSubheading')}</p>
          </div>
          <Link
            href="/search"
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition hover:gap-2 dark:text-sky-400"
          >
            {t('viewAllMasters')}
            <ArrowRight size={14} />
          </Link>
        </div>

        <FilterContainer className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {topMasters.map((m) => (
            <FilterItem key={m.id} className="h-full">
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} className="h-full">
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-blue-200 hover:shadow-[0_24px_48px_-24px_rgba(37,99,235,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900/80">

                  {/* Cover */}
                  <div className="relative h-24 overflow-hidden">
                    <img
                      src={m.bannerUrl || getCoverUrl(m.id)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {m.ratingAverage}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5 pt-0">
                    {/* Avatar straddling the cover edge */}
                    <div className="relative -mt-9 mb-3 w-fit">
                      <img
                        src={m.avatarUrl || getAvatarUrl(m.id, m.displayName)}
                        alt={m.displayName}
                        className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-lg dark:border-slate-900"
                      />
                      {m.hasCertificates && (
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                          <ShieldCheck size={13} strokeWidth={2.4} />
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{m.displayName}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-sky-400">
                      <MapPin size={12} />
                      {m.cityName}
                    </p>

                    {m.categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.categories.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {t('hourlyRate')}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {m.priceFrom ? perHour(m.priceFrom) : '—'}
                        </span>
                      </div>
                      <Link
                        href={`/booking?master=${m.id}`}
                        className="btn-ripple rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-700"
                      >
                        {t('bookCraftsman')}
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </section>

      {/* 7. SHOP PICKS — the feed's one cross-sell into the marketplace. */}
      <RecommendedProducts onAdded={showToast} />

      {/* 8. CTA */}
      <section>
        <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-8 text-white shadow-2xl shadow-blue-900/30 sm:p-12 md:flex-row">
          <div className="animate-float absolute -right-10 -top-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div
            className="animate-float absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl"
            style={{ animationDelay: '1s' }}
          />

          <div className="relative max-w-xl space-y-4 text-center md:text-left">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {t('readyToUpgrade')}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('ctaTitle')}</h2>
            <p className="text-sm leading-relaxed text-blue-100">{t('ctaSubtitle')}</p>
          </div>

          <div className="relative flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/booking"
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-center text-sm font-extrabold text-blue-900 shadow-xl transition hover:shadow-2xl hover:shadow-white/20"
              >
                {t('bookService')}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/auth/register/master"
                className="block rounded-2xl border border-blue-400/40 bg-blue-900/60 px-8 py-4 text-center text-sm font-extrabold text-white transition hover:bg-blue-900/80"
              >
                {t('becomeMaster')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {toast && (
        <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-2xl dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}

    </div>
  );
}
