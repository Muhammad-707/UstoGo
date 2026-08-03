'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { adminApi, categoriesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { waLink } from '@/lib/whatsapp';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import type { AdminMasterListItem, ApprovalStatus, Category, DashboardResponse } from '@/lib/api/types';
import { FilterContainer, FilterItem, InViewRow } from '@/components/ui/FilterAnimate';

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => (c.isLeaf ? [c] : flattenCategories(c.children ?? [])));
}

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardAdmin');
  useRequireAuth(['ADMIN']);

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('PENDING');
  const [masters, setMasters] = useState<AdminMasterListItem[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.dashboard();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    categoriesApi.tree().then((cats) => setCategories(flattenCategories(cats))).catch(() => setCategories([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMasters = async () => {
    setMastersLoading(true);
    setMastersError(null);
    try {
      const res = await adminApi.masters.list({ approvalStatus, categoryId: categoryId || undefined, limit: 20 });
      setMasters(res.items);
    } catch (err) {
      setMastersError(err instanceof ApiError ? err.message : 'Failed to load masters.');
    } finally {
      setMastersLoading(false);
    }
  };

  useEffect(() => {
    loadMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalStatus, categoryId]);

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.masters.approve(id);
      await loadMasters();
      revalidateMastersCache();
    } catch (err) {
      setMastersError(err instanceof ApiError ? err.message : 'Failed to approve master.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    setActingId(id);
    try {
      await adminApi.masters.reject(id, reason);
      await loadMasters();
      revalidateMastersCache();
    } catch (err) {
      setMastersError(err instanceof ApiError ? err.message : 'Failed to reject master.');
    } finally {
      setActingId(null);
    }
  };

  const totalBookings = data
    ? data.bookings.pending + data.bookings.accepted + data.bookings.inProgress + data.bookings.completed + data.bookings.cancelled + data.bookings.expired
    : 0;

  // Real backend response has no revenue/monthly-growth concept — show the metrics that do have a
  // real source instead of fabricating revenue numbers. Counts come from `data.users` (clients /
  // masters) and `data.masters` (moderation buckets), verified against the live Swagger.
  const metrics = data
    ? [
        { title: t('metricTotalClients'), value: data.users.clients.toLocaleString(), growth: t('metricTotalClientsGrowth', { count: data.users.blocked }), icon: 'Users', color: 'from-emerald-500 to-teal-500' },
        { title: t('metricTotalMasters'), value: data.users.masters.toLocaleString(), growth: `${data.masters.approved} ${t('approved')}`, icon: 'shieldcheck', color: 'from-blue-600 to-sky-500' },
        { title: t('metricMonthlyBookings'), value: totalBookings.toLocaleString(), growth: `${data.bookings.completed} completed`, icon: 'BarChart3', color: 'from-amber-500 to-orange-500' },
        { title: 'Average Rating', value: data.reviews.averageRating.toFixed(2), growth: `${data.reviews.count} reviews`, icon: 'Star', color: 'from-purple-600 to-indigo-600' },
      ]
    : [];

  const barMax = data && data.series.length ? Math.max(...data.series.map((s) => s.created), 1) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
          {t('platformHealth')}
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl h-[92px] animate-pulse" />
          ))}
        {!loading &&
          metrics.map((m, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.title}</span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
                <span className="text-[10px] font-bold text-emerald-500">{m.growth}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg`}>
                <Icon name={m.icon} size={22} />
              </div>
            </div>
          ))}
      </div>

      {/* Chart Visual */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('chartTitle')}</h3>
            <p className="text-xs text-slate-500">{t('chartSubtitle')}</p>
          </div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{t('chartPeriod')}</span>
        </div>

        {/* Visual Bar Chart */}
        {!loading && data && data.series.length > 0 && (
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
            {data.series.map((s, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  style={{ height: `${Math.max((s.created / barMax) * 100, 4)}%` }}
                  className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-xl group-hover:from-purple-500 group-hover:to-sky-400 transition"
                />
                <span className="text-[10px] text-slate-400 font-bold">{s.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
        {!loading && data && data.series.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-10">No booking activity data yet.</p>
        )}
        {loading && <div className="h-48 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />}
      </div>

      {/* Master Verification Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('verificationQueue')}</h3>
          <FilterContainer className="flex flex-wrap items-center gap-3">
            <FilterItem>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold transition"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </FilterItem>
            <FilterItem index={1}>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold transition"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FilterItem>
          </FilterContainer>
        </div>

        {mastersError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
            {mastersError}
          </div>
        )}

        {mastersLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!mastersLoading && !mastersError && masters.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-10">No masters found for this filter.</p>
        )}

        {!mastersLoading && masters.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 pr-4">{t('tableApplicant')}</th>
                  <th className="py-3 pr-4">City</th>
                  <th className="py-3 pr-4">Rating</th>
                  <th className="py-3 pr-4">Bookings</th>
                  <th className="py-3 pr-4">{t('tableEarnings')}</th>
                  <th className="py-3 pr-4">{t('tableWhatsApp')}</th>
                  <th className="py-3 pr-4">{t('tableStatus')}</th>
                  <th className="py-3 pr-4">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {masters.map((m, idx) => (
                  <InViewRow key={m.id} index={idx} className="border-b border-slate-50 dark:border-slate-800/60">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-slate-900 dark:text-white">{m.displayName}</div>
                      <div className="text-slate-400">{m.email}</div>
                    </td>
                    <td className="py-3 pr-4">{m.cityName ?? '—'}</td>
                    <td className="py-3 pr-4">{m.ratingAverage}</td>
                    <td className="py-3 pr-4">{m.completedBookingsCount}</td>
                     <td className="py-3 pr-4">${m.totalEarnings}</td>
                     <td className="py-3 pr-4">
                        {m.whatsappPhone ? (
                          <a
                            href={waLink(m.whatsappPhone)!}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[10px] font-bold shadow transition"
                         >
                           <Icon name="whatsapp" size={14} />
                           {t('tableWhatsAppOpen')}
                         </a>
                       ) : (
                         <span className="text-slate-400">—</span>
                       )}
                     </td>
                     <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                        {m.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {m.approvalStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(m.id)}
                            disabled={actingId === m.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(m.id)}
                            disabled={actingId === m.id}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
