'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';

import { useMoney } from '@/lib/money';
import { bookingsApi } from '@/lib/api/endpoints';
import type { Category, MasterPublic, Booking } from '@/lib/api/types';
import { getCategoryVisual } from '@/lib/categoryVisuals';
import { getAvatarUrl } from '@/lib/placeholders';
import { useAuth } from '@/contexts/AuthContext';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { useDateFormat } from '@/lib/datetime';

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
  const te = useTranslations('enums');
  const fmt = useDateFormat();
  const { perHour } = useMoney();
  const { user } = useAuth();

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

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

  return (
    <div className="page-shell py-10 space-y-10">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="relative space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold border border-blue-400/30">
              {t('clientDashboard')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {greetingName ? t('greetingAfternoon', { name: greetingName }) : t('welcome')}
          </h1>
          <p className="text-sm text-slate-300">
            {t('homeSubheading')}
          </p>
        </div>

        <div className="relative flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/search"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
          >
            <Icon name="Search" size={16} />
            <span>{t('searchMasters')}</span>
          </Link>
          <Link
            href="/booking"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center justify-center gap-2 transition"
          >
            <Icon name="Calendar" size={16} />
            <span>{t('bookService')}</span>
          </Link>
        </div>
      </div>

      {/* Active Booking Ticker Banner */}
      {activeBooking && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-slate-900 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md animate-pulse">
              <Icon name="Clock" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-700 dark:text-sky-300 uppercase tracking-wide">
                  {t('activeBookingPrefix')}{activeBooking.bookingNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {te(`bookingStatus.${activeBooking.status}`)}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {activeBooking.serviceTitle} {t('withConnector')} {activeBooking.masterDisplayName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('scheduledForPrefix')} {fmt.dateTime(activeBooking.scheduledAt)}
              </p>
            </div>
          </div>

          <Link
            href={`/booking/${activeBooking.id}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition text-center flex items-center justify-center gap-1.5"
          >
            <span>{t('viewTracker')}</span>
          </Link>
        </div>
      )}

      {/* Quick Action Category Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('topCategories')}</h2>
          <Link href="/categories" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
            {t('allServices')} ({leafCategories.length})
          </Link>
        </div>

        <FilterContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {topCategories.map((cat, idx) => {
            const visual = getCategoryVisual(cat.slug);
            const stat = categoryStats.get(cat.name);
            return (
              <FilterItem key={cat.id} index={idx % 4}>
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link
                href={`/search?category=${cat.id}`}
                className="glass-card rounded-2xl p-5 text-center flex flex-col items-center gap-3 group transition-shadow hover:shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                  <Icon name={visual.iconName} size={26} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {stat ? `${t('mastersCountShort', { count: stat.count })}${stat.minPrice ? ` · ${perHour(stat.minPrice)}` : ''}` : ' '}
                  </p>
                </div>
              </Link>
              </motion.div>
              </FilterItem>
            );
          })}
        </FilterContainer>
      </div>

      {/* Recommended Top Craftsmen Nearby */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('topRatedCraftsmen')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('topRatedSubheading')}</p>
          </div>
          <Link href="/search" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
            {t('viewAllMasters')}
          </Link>
        </div>

        <FilterContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topMasters.map((m, idx) => (
            <FilterItem key={m.id} index={idx % 3}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-200 dark:hover:border-sky-900 h-full transition-[box-shadow,border-color] duration-300"
            >
              <div className="flex items-start gap-4">
                <img src={m.avatarUrl || getAvatarUrl(m.id, m.displayName)} alt={m.displayName} className="w-16 h-16 rounded-2xl object-cover shadow" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{m.displayName}</h3>
                    {m.hasCertificates && <Icon name="ShieldCheck" size={15} className="text-blue-500" />}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">{m.cityName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Icon name="Star" size={13} className="fill-amber-400" />
                      {m.ratingAverage}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('hourlyRate')}</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {m.priceFrom ? perHour(m.priceFrom) : '—'}
                  </span>
                </div>
                <Link
                  href={`/booking?master=${m.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
                >
                  {t('bookCraftsman')}
                </Link>
              </div>
            </motion.div>
            </FilterItem>
          ))}
        </FilterContainer>
      </div>

    </div>
  );
}
