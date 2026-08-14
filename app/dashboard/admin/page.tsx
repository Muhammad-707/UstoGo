'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChartColumn, ShieldCheck, Star, Users } from 'lucide-react';
import { Icon } from '@/components/icons/LucideIcons';
import { useMoney } from '@/lib/money';
import { useTranslations } from 'next-intl';
import { adminApi, bookingsApi, categoriesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { waLink } from '@/lib/whatsapp';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AdminMasterListItem, ApprovalStatus, Booking, Category, DashboardResponse, PlatformNps } from '@/lib/api/types';
import { FilterContainer, FilterItem, InViewRow } from '@/components/ui/FilterAnimate';
import { BookingsChart } from '@/components/dashboard/BookingsChart';
import { MetricGrid, type Metric } from '@/components/dashboard/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => (c.isLeaf ? [c] : flattenCategories(c.children ?? [])));
}

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardAdmin');
  const te = useTranslations('enums');
  const { money } = useMoney();
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
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('errLoadDashboard'));
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
      setMastersError(err instanceof ApiError ? err.message : t('errLoadMasters'));
    } finally {
      setMastersLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches masters on filter change
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
      setMastersError(err instanceof ApiError ? err.message : t('errApprove'));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt(t('rejectionReasonPrompt'));
    if (!reason) return;
    setActingId(id);
    try {
      await adminApi.masters.reject(id, reason);
      await loadMasters();
      revalidateMastersCache();
    } catch (err) {
      setMastersError(err instanceof ApiError ? err.message : t('errReject'));
    } finally {
      setActingId(null);
    }
  };

  const handleMasterClick = async (master: AdminMasterListItem) => {
    setSelectedMaster(master);
    setMasterBookingsLoading(true);
    try {
      const res = await bookingsApi.list({ limit: 50, status: 'ACCEPTED' });
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

  const metrics: Metric[] = data
    ? [
        {
          label: t('metricTotalClients'),
          value: data.users.clients,
          hint: t('metricTotalClientsGrowth', { count: data.users.blocked }),
          Icon: Users,
          tone: 'emerald',
          href: '/dashboard/admin/users',
        },
        {
          label: t('metricTotalMasters'),
          value: data.users.masters,
          hint: `${data.masters.approved} ${t('approved')}`,
          Icon: ShieldCheck,
          tone: 'blue',
          href: '/dashboard/admin/users',
        },
        {
          label: t('metricMonthlyBookings'),
          value: totalBookings,
          hint: t('metricCompletedCount', { count: data.bookings.completed }),
          Icon: ChartColumn,
          tone: 'amber',
          href: '/dashboard/admin/bookings',
        },
        {
          label: t('metricAverageRating'),
          value: data.reviews.averageRating,
          decimals: 2,
          hint: t('metricReviewsCount', { count: data.reviews.count }),
          Icon: Star,
          tone: 'violet',
          href: '/dashboard/admin/reviews',
        },
      ]
    : [];

  return (
    <DashboardLayout role="ADMIN" title={t('title')} subtitle={t('platformHealth')}>
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Metrics Grid — every tile links to the screen its figure came from, which is
          what an operator opens this page to do next. */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-[148px] rounded-[1.5rem]" />
          ))}
        </div>
      ) : (
        <MetricGrid metrics={metrics} />
      )}

      {/* Chart + Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        {/* Bookings per day.
            Three things were wrong with the old chart. It was titled "Revenue &
            Bookings Growth" and labelled "2026" while plotting neither revenue nor a
            year — the series is a rolling window of daily booking counts and carries
            no money at all. It threw away half the data it was given: the API returns
            `created` *and* `completed` per day and only `created` was drawn. And it
            floored every bar at 4% height, so a day with zero bookings rendered a
            visible stub — which is why the chart read as a flat line with a few random
            spikes rather than as mostly-empty days. */}
        <Card className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('chartTitle')}</h3>
              <p className="text-xs text-slate-500">{t('chartSubtitle', { days: data?.series.length ?? 0 })}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-violet-600 to-indigo-500" />
                {t('chartCreated')}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-emerald-600 to-teal-400" />
                {t('chartCompleted')}
              </span>
            </div>
          </div>

          {!loading && data && data.series.length > 0 && <BookingsChart series={data.series} />}

          {!loading && data && data.series.length === 0 && (
            <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noChartData')}</p>
          )}
          {loading && <Skeleton className="h-52 rounded-2xl" />}
        </Card>

        {/* Quick Stats */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('quickStats')}</h3>
          <div className="space-y-3">
            {[
              { label: t('metricTotalClients'), value: data?.users.clients.toLocaleString() ?? '—', icon: 'Users', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
              { label: t('metricTotalMasters'), value: data?.users.masters.toLocaleString() ?? '—', icon: 'shieldcheck', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
              { label: t('metricMonthlyBookings'), value: totalBookings.toLocaleString() ?? '—', icon: 'BarChart3', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
              { label: t('metricAvgRatingShort'), value: data ? data.reviews.averageRating.toFixed(2) : '—', icon: 'Star', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
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
        </Card>
      </div>

      {/* Platform NPS */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('npsTitle')}</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('npsSubtitle')}</p>
        </div>
        {npsLoading && <Skeleton className="h-24 rounded-2xl" />}
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
      </Card>

      {/* Master Verification Table */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('verificationQueue')}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('verificationQueueSub')}</p>
          </div>
          <FilterContainer className="flex flex-wrap items-center gap-3">
            <FilterItem>
              <Select value={approvalStatus} onValueChange={(value) => { setApprovalStatus(value as ApprovalStatus); }}>
                <SelectTrigger className="w-auto p-2.5 rounded-xl text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="PENDING">{t('filterPending')}</SelectItem>
                <SelectItem value="APPROVED">{t('filterApproved')}</SelectItem>
                <SelectItem value="REJECTED">{t('filterRejected')}</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>
            <FilterItem index={1}>
              <Select value={categoryId || ANY} onValueChange={(raw) => { const value = raw === ANY ? '' : raw; setCategoryId(value); }}>
                <SelectTrigger className="w-auto p-2.5 rounded-xl text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>{t('allCategories')}</SelectItem>
                
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
                </SelectContent>
              </Select>
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
              <Skeleton key={idx} className="h-14 rounded-2xl" />
            ))}
          </div>
        )}

        {!mastersLoading && !mastersError && masters.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Icon name="shieldcheck" size={24} />
            </div>
            <p className="text-xs text-slate-400 font-semibold">{t('noMastersForFilter')}</p>
          </div>
        )}

        {!mastersLoading && masters.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 pr-4">{t('tableApplicant')}</th>
                  <th className="py-3 pr-4">{t('colCity')}</th>
                  <th className="py-3 pr-4">{t('colRating')}</th>
                  <th className="py-3 pr-4">{t('colBookings')}</th>
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
                    <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{money(m.totalEarnings)}</td>
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
                        {te(`approvalStatus.${m.approvalStatus}`)}
                      </span>
                    </td>
                    <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {m.approvalStatus === 'PENDING' && (
                          <>
                            <Button size="raw" variant="ghost"
                              onClick={() => handleApprove(m.id)}
                              disabled={actingId === m.id}
                              className="btn-success px-3 py-1.5 rounded-xl disabled:opacity-60 font-bold transition"
                            >
                              {t('actionApprove')}
                            </Button>
                            <Button size="raw" variant="ghost"
                              onClick={() => handleReject(m.id)}
                              disabled={actingId === m.id}
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold shadow-sm transition"
                            >
                              {t('actionReject')}
                            </Button>
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
      </Card>

      {/* Master Booking Details Overlay */}
      <Dialog open={!!selectedMaster} onOpenChange={(open) => !open && setSelectedMaster(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
          {selectedMaster && (
            <>
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 pr-6 flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-xl text-white">{selectedMaster.displayName}</DialogTitle>
                <DialogDescription className="text-purple-100">{selectedMaster.email}</DialogDescription>
              </div>
              <DialogClose asChild>
                <Button size="icon" className="rounded-xl bg-white/20 hover:bg-white/30 text-white">
                  <Icon name="x" size={18} />
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-center">
                  <p className="text-[10px] font-bold text-purple-400 uppercase">{t('colBookings')}</p>
                  <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{masterBookings.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-center">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">{t('colRating')}</p>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{selectedMaster.ratingAverage}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">{t('colEarnings')}</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{money(selectedMaster.totalEarnings)}</p>
                </div>
              </div>

              {masterBookingsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-2xl" />
                  ))}
                </div>
              ) : masterBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Icon name="checkcircle2" size={20} />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">{t('noActiveBookings')}</p>
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
                          {te(`bookingStatus.${b.status}`)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.clientName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}