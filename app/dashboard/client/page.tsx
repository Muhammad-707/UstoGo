'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { bookingsApi } from '@/lib/api/endpoints';
import type { Booking } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { useFavorites } from '@/hooks/useFavorites';
import { FilterContainer, FilterItem, InViewRow } from '@/components/ui/FilterAnimate';

export default function ClientDashboardPage() {
  const t = useTranslations('dashboardClient');
  const { favoriteIds } = useFavorites();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .list({ limit: 20 })
      .then((res) => setBookings(res.items))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const active = bookings.filter((b) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  const totalSpent = completed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const metrics = [
    { title: t('metricTotalSpent'), value: `$${totalSpent.toFixed(2)}`, icon: 'DollarSign', color: 'from-blue-600 to-sky-500' },
    { title: t('metricActiveBookings'), value: t('metricActiveBookingsValue', { count: active.length }), icon: 'Clock', color: 'from-amber-500 to-orange-500' },
    { title: t('metricCompletedProjects'), value: t('metricCompletedProjectsValue', { count: completed.length }), icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-500' },
    { title: t('metricSavedMasters'), value: t('metricSavedMastersValue', { count: favoriteIds.length }), icon: 'Heart', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('overview')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
        <Link
          href="/search"
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple flex items-center gap-2"
        >
          <Icon name="Calendar" size={16} />
          <span>{t('newBooking')}</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <FilterContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <FilterItem key={idx} index={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.title}</span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg`}>
              <Icon name={m.icon} size={22} />
            </div>
          </FilterItem>
        ))}
      </FilterContainer>

      {/* Recent Bookings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('recentBookings')}</h3>
        </div>

        {loading && <p className="text-xs text-slate-400 font-semibold">Loading…</p>}
        {!loading && bookings.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">No bookings yet.</p>
        )}

        {!loading && bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">{t('tableCode')}</th>
                  <th className="pb-3">{t('tableService')}</th>
                  <th className="pb-3">{t('tableMaster')}</th>
                  <th className="pb-3">{t('tableDate')}</th>
                  <th className="pb-3">{t('tablePrice')}</th>
                  <th className="pb-3">{t('tableStatus')}</th>
                  <th className="pb-3 text-right">{t('tableAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {bookings.map((b, idx) => (
                  <InViewRow key={b.id} index={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-4 font-mono font-bold text-blue-600 dark:text-sky-400">{b.bookingNumber}</td>
                    <td className="py-4 text-slate-900 dark:text-white">{b.serviceTitle}</td>
                    <td className="py-4 flex items-center gap-2">
                      <img src={getAvatarUrl(b.masterId)} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span>{b.masterDisplayName}</span>
                    </td>
                    <td className="py-4 text-slate-500">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">{b.price} {b.currency}</td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link href={`/booking/${b.id}`} className="text-blue-600 hover:underline">
                        {t('details')}
                      </Link>
                    </td>
                  </InViewRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
