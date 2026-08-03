'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { bookingsApi, mastersApi } from '@/lib/api/endpoints';
import { getBookingsSocket } from '@/lib/bookings/socket';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getAvatarUrl } from '@/lib/placeholders';
import type { Booking, MasterPublic } from '@/lib/api/types';
import { FilterContainer, FilterItem, InViewRow } from '@/components/ui/FilterAnimate';

export default function ClientDashboardPage() {
  const t = useTranslations('dashboardClient');
  useRequireAuth(['CLIENT']);
  const { favoriteIds } = useFavorites();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [mastersMap, setMastersMap] = useState<Record<string, MasterPublic>>({});
  const [mastersLoading, setMastersLoading] = useState(true);

  const [selectedMaster, setSelectedMaster] = useState<MasterPublic | null>(null);

  useEffect(() => {
    bookingsApi
      .list({ limit: 20 })
      .then((res) => setBookings(res.items))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const masterIds = [...new Set(bookings.map((b) => b.masterId))];
    if (masterIds.length === 0) {
      setMastersLoading(false);
      return;
    }
    setMastersLoading(true);
    Promise.all(
      masterIds.map((id) =>
        mastersApi.byId(id).then((m) => [id, m] as [string, MasterPublic]).catch(() => null),
      ),
    )
      .then((results) => {
        const map: Record<string, MasterPublic> = {};
        results.forEach((r) => {
          if (r) map[r[0]] = r[1];
        });
        setMastersMap(map);
      })
      .catch(() => {})
      .finally(() => setMastersLoading(false));
  }, [bookings]);

  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const active = bookings.filter((b) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));

  useEffect(() => {
    if (active.length === 0) return;
    const interval = setInterval(() => {
      bookingsApi
        .list({ limit: 20 })
        .then((res) => setBookings(res.items))
        .catch(() => {});
    }, 20_000);
    return () => clearInterval(interval);
  }, [active.length]);

  useEffect(() => {
    const socket = getBookingsSocket();
    const onUpdate = () => {
      bookingsApi
        .list({ limit: 20 })
        .then((res) => setBookings(res.items))
        .catch(() => {});
    };
    socket?.on('booking:update', onUpdate);
    return () => {
      socket?.off('booking:update', onUpdate);
    };
  }, []);

  const totalSpent = completed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const metrics = [
    { title: t('metricTotalSpent'), value: `$${totalSpent.toFixed(2)}`, icon: 'DollarSign', color: 'from-blue-600 to-sky-500' },
    { title: t('metricActiveBookings'), value: t('metricActiveBookingsValue', { count: active.length }), icon: 'Clock', color: 'from-amber-500 to-orange-500' },
    { title: t('metricCompletedProjects'), value: t('metricCompletedProjectsValue', { count: completed.length }), icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-500' },
    { title: t('metricSavedMasters'), value: t('metricSavedMastersValue', { count: favoriteIds.length }), icon: 'Heart', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <DashboardLayout role="CLIENT" title={t('title')} subtitle={t('overview')}>
      {/* Metrics Grid */}
      <FilterContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                  <InViewRow key={b.id} index={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => { const m = mastersMap[b.masterId]; if (m) setSelectedMaster(m); }}>
                    <td className="py-4 font-mono font-bold text-blue-600 dark:text-sky-400">{b.bookingNumber}</td>
                    <td className="py-4 text-slate-900 dark:text-white">{b.serviceTitle}</td>
                    <td className="py-4 flex items-center gap-2">
                      <img src={getAvatarUrl(b.masterId, b.masterDisplayName)} alt="" className="w-6 h-6 rounded-full object-cover" />
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
                      <Link href={`/booking/${b.id}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
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

      {/* Master Profile Overlay */}
      {selectedMaster && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMaster(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {selectedMaster.bannerUrl && (
              <img src={selectedMaster.bannerUrl} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 -mt-12">
                <img src={selectedMaster.avatarUrl ?? getAvatarUrl(selectedMaster.id, selectedMaster.displayName)} alt={selectedMaster.displayName} className="w-20 h-20 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedMaster.displayName}</h2>
                  <p className="text-xs text-slate-500">{selectedMaster.cityName}</p>
                  <p className="text-xs text-amber-500 font-bold">★ {selectedMaster.ratingAverage} ({selectedMaster.ratingCount})</p>
                </div>
              </div>

              {selectedMaster.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedMaster.bio}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">Experience</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{selectedMaster.yearsOfExperience} yrs</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">Service Radius</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{selectedMaster.serviceRadiusKm} km</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">Completed</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{selectedMaster.completedBookingsCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">Categories</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{selectedMaster.categories.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              {selectedMaster.whatsappPhone && (
                <a
                  href={`https://wa.me/${selectedMaster.whatsappPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-xs shadow transition"
                >
                  <Icon name="whatsapp" size={16} />
                  Write on WhatsApp
                </a>
              )}

              <Link
                href={`/master/${selectedMaster.id}`}
                className="flex items-center justify-center w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                onClick={() => setSelectedMaster(null)}
              >
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}