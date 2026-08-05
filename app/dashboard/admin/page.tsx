'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { adminApi, bookingsApi, categoriesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { waLink } from '@/lib/whatsapp';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AdminMasterListItem, ApprovalStatus, Booking, Category, DashboardResponse, PlatformNps } from '@/lib/api/types';
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

  const [selectedMaster, setSelectedMaster] = useState<AdminMasterListItem | null>(null);
  const [masterBookings, setMasterBookings] = useState<Booking[]>([]);
  const [masterBookingsLoading, setMasterBookingsLoading] = useState(false);

  const [nps, setNps] = useState<PlatformNps | null>(null);
  const [npsLoading, setNpsLoading] = useState(true);

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
    adminApi.nps().then(setNps).catch(() => setNps(null)).finally(() => setNpsLoading(false));
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

  const handleMasterClick = async (master: AdminMasterListItem) => {
    setSelectedMaster(master);
    setMasterBookingsLoading(true);
    try {
      const res = await bookingsApi.list({ limit: 50, status: 'ACCEPTED' });
      const allBookings = res.items;
      const allPages = [res];
      let hasMore = res.meta.page < res.meta.totalPages;
      let page = 2;
      while (hasMore) {
        const next = await bookingsApi.list({ limit: 50, status: 'ACCEPTED', page });
        allPages.push(next);
        hasMore = page < next.meta.totalPages;
        page++;
      }
      const all = allPages.flatMap((p) => p.items);
      setMasterBookings(all.filter((b) => b.masterId === master.id));
    } catch {
      setMasterBookings([]);
    } finally {
      setMasterBookingsLoading(false);
    }
  };

  const totalBookings = data
    ? data.bookings.pending + data.bookings.accepted + data.bookings.inProgress + data.bookings.completed + data.bookings.cancelled + data.bookings.expired
    : 0;

  const metrics = data
    ? [
        { title: t('metricTotalClients'), value: data.users.clients.toLocaleString(), growth: t('metricTotalClientsGrowth', { count: data.users.blocked }), icon: 'Users', color: 'from-emerald-500 to-teal-500', bg: 'from-emerald-500/10 to-teal-500/10' },
        { title: t('metricTotalMasters'), value: data.users.masters.toLocaleString(), growth: `${data.masters.approved} ${t('approved')}`, icon: 'shieldcheck', color: 'from-blue-600 to-sky-500', bg: 'from-blue-600/10 to-sky-500/10' },
        { title: t('metricMonthlyBookings'), value: totalBookings.toLocaleString(), growth: `${data.bookings.completed} completed`, icon: 'BarChart3', color: 'from-amber-500 to-orange-500', bg: 'from-amber-500/10 to-orange-500/10' },
        { title: 'Average Rating', value: data.reviews.averageRating.toFixed(2), growth: `${data.reviews.count} reviews`, icon: 'Star', color: 'from-purple-600 to-indigo-600', bg: 'from-purple-600/10 to-indigo-600/10' },
      ]
    : [];

  const barMax = data && data.series.length ? Math.max(...data.series.map((s) => s.created), 1) : 1;

  return (
    <DashboardLayout role="ADMIN" title={t('title')} subtitle={t('platformHealth')}>
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl h-[100px] animate-pulse" />
          ))}
        {!loading &&
          metrics.map((m, idx) => (
            <div key={idx} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between group hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.title}</span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
                <span className="text-[10px] font-bold text-emerald-500">{m.growth}</span>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon name={m.icon} size={24} />
              </div>
            </div>
          ))}
      </div>

      {/* Chart + Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('chartTitle')}</h3>
              <p className="text-xs text-slate-500">{t('chartSubtitle')}</p>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{t('chartPeriod')}</span>
          </div>

          {!loading && data && data.series.length > 0 && (
            <div className="h-52 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
              {data.series.map((s, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div
                    style={{ height: `${Math.max((s.created / barMax) * 100, 4)}%` }}
                    className="w-full bg-gradient-to-t from-purple-600 via-indigo-500 to-sky-400 rounded-t-xl group-hover:from-purple-500 group-hover:to-sky-300 transition-all duration-300 shadow-md"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">{s.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
          {!loading && data && data.series.length === 0 && (
            <p className="text-xs text-slate-400 font-semibold text-center py-10">No booking activity data yet.</p>
          )}
          {loading && <div className="h-52 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />}
        </div>

        {/* Quick Stats */}
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('quickStats')}</h3>
          <div className="space-y-3">
            {[
              { label: t('metricTotalClients'), value: data?.users.clients.toLocaleString() ?? '—', icon: 'Users', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
              { label: t('metricTotalMasters'), value: data?.users.masters.toLocaleString() ?? '—', icon: 'shieldcheck', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
              { label: t('metricMonthlyBookings'), value: totalBookings.toLocaleString() ?? '—', icon: 'BarChart3', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
              { label: 'Avg Rating', value: data ? data.reviews.averageRating.toFixed(2) : '—', icon: 'Star', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                    <Icon name={s.icon} size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform NPS */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('npsTitle')}</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('npsSubtitle')}</p>
        </div>
        {npsLoading && <div className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />}
        {!npsLoading && (!nps || nps.responseCount === 0) && (
          <p className="text-xs text-slate-400 font-semibold">{t('npsNoData')}</p>
        )}
        {!npsLoading && nps && nps.responseCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-center">
              <p className="text-[10px] font-bold text-blue-400 uppercase">{t('npsOverall')}</p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{nps.overallNps ?? '—'}</p>
              <p className="text-[10px] text-slate-400">{t('npsResponses', { count: nps.responseCount })}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
              <p className="text-[10px] font-bold text-emerald-400 uppercase">{t('npsPromoters')}</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{nps.promoters}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-center">
              <p className="text-[10px] font-bold text-amber-400 uppercase">{t('npsPassives')}</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{nps.passives}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-center">
              <p className="text-[10px] font-bold text-red-400 uppercase">{t('npsDetractors')}</p>
              <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{nps.detractors}</p>
            </div>
          </div>
        )}
      </div>

      {/* Master Verification Table */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('verificationQueue')}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('verificationQueueSub')}</p>
          </div>
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
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Icon name="shieldcheck" size={24} />
            </div>
            <p className="text-xs text-slate-400 font-semibold">No masters found for this filter.</p>
          </div>
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
                  <InViewRow
                    key={m.id}
                    index={idx}
                    className="border-b border-slate-50 dark:border-slate-800/60 cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-colors group"
                    onClick={() => handleMasterClick(m)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                          {m.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{m.displayName}</div>
                          <div className="text-slate-400">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{m.cityName ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Icon name="star" size={10} className="fill-amber-400" />
                        {m.ratingAverage}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                        {m.completedBookingsCount}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">${m.totalEarnings}</td>
                    <td className="py-3 pr-4">
                      {m.whatsappPhone ? (
                        <a
                          href={waLink(m.whatsappPhone)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[10px] font-bold shadow transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon name="whatsapp" size={14} />
                          {t('tableWhatsAppOpen')}
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${
                        m.approvalStatus === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : m.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                      }`}>
                        {m.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {m.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(m.id)}
                              disabled={actingId === m.id}
                              className="btn-success px-3 py-1.5 rounded-xl disabled:opacity-60 font-bold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(m.id)}
                              disabled={actingId === m.id}
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold shadow-sm transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          href={`/dashboard/admin/masters/${m.id}`}
                          className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-sm transition hover:bg-purple-200 dark:hover:bg-purple-900/60"
                        >
                          {t('tableStats')}
                        </Link>
                      </div>
                    </td>
                  </InViewRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Master Booking Details Overlay */}
      {selectedMaster && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMaster(null)}>
          <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">{selectedMaster.displayName}</h2>
                  <p className="text-purple-100 text-xs">{selectedMaster.email}</p>
                </div>
                <button onClick={() => setSelectedMaster(null)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition">
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-center">
                  <p className="text-[10px] font-bold text-purple-400 uppercase">Bookings</p>
                  <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{masterBookings.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-center">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Rating</p>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{selectedMaster.ratingAverage}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">Earnings</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">${selectedMaster.totalEarnings}</p>
                </div>
              </div>

              {masterBookingsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : masterBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Icon name="checkcircle2" size={20} />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">No active bookings for this master.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="clock" size={14} className="text-purple-500" />
                    Active Bookings
                  </h3>
                  {masterBookings.map((b) => (
                    <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{b.bookingNumber}</p>
                        <p className="text-[10px] text-slate-500">{b.serviceTitle}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          b.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {b.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.clientName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}