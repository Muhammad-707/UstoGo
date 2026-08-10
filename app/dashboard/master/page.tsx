'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';

import { useWeekdays } from '@/lib/datetime';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { bookingsApi, citiesApi, masterCabinetApi, mastersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { downloadFile } from '@/lib/api/download';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { getBookingsSocket } from '@/lib/bookings/socket';
import { useMoney } from '@/lib/money';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Booking, City, MasterNps, MasterStats, MasterStatus, WorkingDay } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { AnalyticsSection } from '@/components/master/AnalyticsSection';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export default function MasterDashboardPage() {
  const t = useTranslations('dashboardMaster');
  const { money } = useMoney();
  const weekdays = useWeekdays();
  useRequireAuth(['MASTER']);
  const { user, refreshUser } = useAuth();
  const masterProfile = user?.masterProfile;
  const [togglingActive, setTogglingActive] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const [pending, setPending] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<WorkingDay[]>([]);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingSchedule, setExportingSchedule] = useState(false);

  const handleExportSchedule = useCallback(async () => {
    setExportingSchedule(true);
    try {
      await downloadFile('/bookings/me/schedule.ics', 'ustogo-schedule.ics');
    } catch {
      // best-effort — no toast system wired up here yet
    } finally {
      setExportingSchedule(false);
    }
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [stats, setStats] = useState<MasterStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [nps, setNps] = useState<MasterNps | null>(null);
  const [status, setStatus] = useState<MasterStatus | null>(null);
  const [togglingInstantBook, setTogglingInstantBook] = useState(false);

  useEffect(() => {
    citiesApi.list().then((list) => setCities(list)).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    bookingsApi
      .myStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
    mastersApi.myNps().then(setNps).catch(() => setNps(null));
    masterCabinetApi.myStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const handleToggleInstantBook = async () => {
    if (!status) return;
    setTogglingInstantBook(true);
    try {
      const updated = await masterCabinetApi.setInstantBook(!status.instantBookEnabled);
      setStatus(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update instant-book.');
    } finally {
      setTogglingInstantBook(false);
    }
  };

  useEffect(() => {
    if (!masterProfile?.id) return;
    mastersApi
      .media(masterProfile.id)
      .then((media) => {
        setAvatarUrl(media.avatarUrl);
        setPortfolioCount(media.portfolio.length);
      })
      .catch(() => {});
    masterCabinetApi.myServices().then((list) => setActiveServicesCount(list.filter((s) => s.isActive).length)).catch(() => {});
    masterCabinetApi.mySchedule().then(setSchedule).catch(() => setSchedule([]));
  }, [masterProfile?.id]);

  const cityName = (cityId?: string | null) => (cityId ? cities.find((c) => c.id === cityId)?.name : undefined);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, upcomingRes] = await Promise.all([
        bookingsApi.list({ status: 'PENDING', limit: 10 }),
        bookingsApi.list({ status: 'ACCEPTED', limit: 10 }),
      ]);
      setPending(pendingRes.items);
      setUpcoming(upcomingRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches bookings on mount
    loadBookings();
  }, [loadBookings]);

  // Live "new job request" push (BookingsGateway) — a new PENDING booking, or the
  // client cancelling one, should show up here without a manual refresh.
  useEffect(() => {
    const socket = getBookingsSocket();
    const onUpdate = () => {
      loadBookings();
    };
    socket?.on('booking:update', onUpdate);
    return () => {
      socket?.off('booking:update', onUpdate);
    };
  }, [loadBookings]);

  const handleAccept = async (id: string) => {
    setActingId(id);
    try {
      await bookingsApi.accept(id);
      setPending((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept booking.');
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActingId(id);
    try {
      await bookingsApi.reject(id, 'Not available');
      setPending((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to decline booking.');
    } finally {
      setActingId(null);
    }
  };

  const handleStart = async (id: string) => {
    setActingId(id);
    try {
      await bookingsApi.start(id);
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'TOO_EARLY_TO_START' || err.status === 422)) {
        setError(t('startJobTooEarly'));
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to start job.');
      }
    } finally {
      setActingId(null);
    }
  };

  const handleToggleAvailability = async () => {
    if (!masterProfile || masterProfile.approvalStatus !== 'APPROVED') return;
    setTogglingActive(true);
    try {
      await masterCabinetApi.setAvailability(!masterProfile.isActive);
      await refreshUser();
      revalidateMastersCache();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update availability.');
    } finally {
      setTogglingActive(false);
    }
  };

  /**
   * The only way out of a REJECTED profile. Without this a rejected master saw the
   * rejection and had no action to take — `POST /masters/me/resubmit` existed with
   * nothing calling it.
   */
  const handleResubmit = async () => {
    setResubmitting(true);
    setError(null);
    try {
      await masterCabinetApi.resubmit();
      await refreshUser();
      const fresh = await masterCabinetApi.myStatus();
      setStatus(fresh);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('resubmitFailed'));
    } finally {
      setResubmitting(false);
    }
  };

  const metrics = [
    {
      title: t('metricJobsCompleted'),
      value: String(masterProfile?.completedBookingsCount ?? 0),
      growth: t('metricJobsCompletedValue', { count: masterProfile?.completedBookingsCount ?? 0 }),
      icon: 'checkcircle2',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: t('metricCustomerRating'),
      value: masterProfile ? `${Number(masterProfile.ratingAverage).toFixed(1)} / 5` : '—',
      growth: `${masterProfile?.ratingCount ?? 0} ${t('reviewsCount')}`,
      icon: 'star',
      color: 'from-yellow-500 to-amber-500',
    },
    {
      title: t('metricActiveServices'),
      value: String(activeServicesCount),
      growth: t('metricActiveServicesSub'),
      icon: 'briefcase',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: t('metricUpcomingJobs'),
      value: String(upcoming.length),
      growth: t('metricUpcomingJobsSub'),
      icon: 'calendar',
      color: 'from-violet-500 to-purple-500',
    },
  ];

  const quickActions = [
    { href: '/settings/services', label: t('qaServices'), icon: 'briefcase', color: 'bg-blue-500' },
    { href: '/settings/schedule', label: t('qaSchedule'), icon: 'clock', color: 'bg-emerald-500' },
    { href: '/settings/portfolio', label: t('qaPortfolio'), icon: 'image', color: 'bg-violet-500' },
    { href: '/settings/certificates', label: t('qaCertificates'), icon: 'award', color: 'bg-amber-500' },
    { href: '/settings/profile', label: t('qaProfile'), icon: 'mappin', color: 'bg-rose-500' },
    { href: '/messages', label: t('qaWhatsApp'), icon: 'whatsapp', color: 'bg-[#25D366]' },
    { href: '/quotes', label: t('qaQuotes'), icon: 'calculator', color: 'bg-cyan-500' },
    { href: '/dashboard/master/schedule-optimizer', label: t('qaRouteOptimizer'), icon: 'compass', color: 'bg-teal-500' },
    { href: '/settings/quick-replies', label: t('qaQuickReplies'), icon: 'message', color: 'bg-indigo-500' },
    { href: '/payments', label: t('qaPayments'), icon: 'creditcard', color: 'bg-fuchsia-500' },
  ];

  const orderedSchedule = [...schedule].sort((a, b) => {
    const today = new Date().getDay();
    const rot = (w: number) => (w - today + 7) % 7;
    return rot(a.weekday) - rot(b.weekday);
  });

  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayFor = (date: Date) => orderedSchedule.find((d) => d.weekday === date.getDay());

  const MIN_PORTFOLIO_PHOTOS = 3;
  const missingAvatar = avatarUrl === null;
  const missingPortfolio = portfolioCount !== null && portfolioCount < MIN_PORTFOLIO_PHOTOS;
  const profileIncomplete = portfolioCount !== null && (missingAvatar || missingPortfolio);
  const unfinishedJobsCount = (stats?.pendingCount ?? 0) + (stats?.acceptedCount ?? 0);

  return (
    <DashboardLayout role="MASTER" title={t('title')} subtitle={t('overview')} action={
      <div className="flex items-center gap-3">
        <Link
          href="/settings/schedule"
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {t('manageSchedule')}
        </Link>
        <Link
          href="/settings/services"
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
        >
          {t('editServices')}
        </Link>
      </div>
    }>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!statsLoading && unfinishedJobsCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <Icon name="clock" size={18} className="text-blue-500 shrink-0" />
          <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
            {t('unfinishedJobsWarning', { count: unfinishedJobsCount })}
          </p>
        </div>
      )}

      {profileIncomplete && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-3">
            <Icon name="award" size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              {t('incompleteProfileNotice', { count: MIN_PORTFOLIO_PHOTOS })}
            </p>
          </div>
          <Link
            href="/settings/profile"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition"
          >
            {t('incompleteProfileCta')}
          </Link>
        </div>
      )}

      {/* Profile Hero */}
      {masterProfile && (
        <FilterContainer className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/60 rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl text-white flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative shrink-0">
            <img src={avatarUrl ?? getAvatarUrl(masterProfile.id, masterProfile.displayName)} alt={masterProfile.displayName} className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-400/40 shadow-2xl" />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-white shadow-lg" title={t('verifiedMaster')}>
              <Icon name="shieldcheck" size={14} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold">{masterProfile.displayName}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Icon name="mappin" size={13} />
                {cityName(masterProfile.cityId) ?? '—'}
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Icon name="star" size={13} className="fill-amber-400 text-amber-400" />
                {masterProfile.ratingAverage} ({masterProfile.ratingCount})
              </span>
              {masterProfile.yearsOfExperience > 0 && (
                <span className="flex items-center gap-1">
                  <Icon name="award" size={13} />
                  {t('yearsExperience', { count: masterProfile.yearsOfExperience })}
                </span>
              )}
            </div>
          </div>
          {masterProfile.approvalStatus === 'APPROVED' ? (
            <button
              onClick={handleToggleAvailability}
              disabled={togglingActive}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-extrabold transition disabled:opacity-60 ${
                masterProfile.isActive
                  ? 'bg-white/10 border-white/10 hover:bg-white/15'
                  : 'bg-red-500/10 border-red-400/30 hover:bg-red-500/20'
              }`}
              title={t('toggleAvailabilityHint')}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  masterProfile.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              {masterProfile.isActive ? t('statusActive') : t('statusInactive')}
            </button>
          ) : (
            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {masterProfile.approvalStatus === 'REJECTED' ? t('statusRejected') : t('statusPending')}
            </div>
          )}
        </FilterContainer>
      )}

      {/* Moderation feedback — the only place a rejected master learns why and can act. */}
      {masterProfile && masterProfile.approvalStatus !== 'APPROVED' && (
        <div
          className={`glass-card rounded-3xl border p-6 sm:p-8 shadow-xl space-y-4 ${
            masterProfile.approvalStatus === 'REJECTED'
              ? 'border-red-200 dark:border-red-900/60'
              : 'border-amber-200 dark:border-amber-900/60'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${
                masterProfile.approvalStatus === 'REJECTED'
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Icon name={masterProfile.approvalStatus === 'REJECTED' ? 'x' : 'clock'} size={20} />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {masterProfile.approvalStatus === 'REJECTED'
                  ? t('moderationRejectedTitle')
                  : t('moderationPendingTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                {masterProfile.approvalStatus === 'REJECTED'
                  ? t('moderationRejectedHint')
                  : t('moderationPendingHint')}
              </p>
              {masterProfile.rejectionReason && (
                <div className="mt-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-500">
                    {t('moderationReasonLabel')}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                    {masterProfile.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {masterProfile.approvalStatus === 'REJECTED' && (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/settings/profile"
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t('moderationEditProfile')}
              </Link>
              <button
                onClick={handleResubmit}
                disabled={resubmitting}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-lg shadow-amber-500/25 disabled:opacity-60 transition"
              >
                {resubmitting ? '...' : t('moderationResubmit')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reliability & Instant Book */}
      {status && masterProfile?.approvalStatus === 'APPROVED' && (
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shrink-0">
              <Icon name="shieldcheck" size={22} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t('reliabilityScoreTitle')}</h3>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {status.reliabilityScore !== null ? `${Number(status.reliabilityScore).toFixed(0)}%` : '—'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">{t('reliabilityScoreDesc')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{t('instantBookTitle')}</p>
              <p className="text-[10px] text-slate-400 max-w-[160px]">{t('instantBookDesc')}</p>
            </div>
            <button
              onClick={handleToggleInstantBook}
              disabled={togglingInstantBook}
              role="switch"
              aria-checked={status.instantBookEnabled}
              className={`relative w-11 h-6 rounded-full shrink-0 transition disabled:opacity-60 ${
                status.instantBookEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  status.instantBookEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <FilterContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <FilterItem key={idx} index={idx} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between hover:shadow-2xl hover:-translate-y-0.5 transition">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.title}</span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
              {m.growth && <span className="text-[10px] font-bold text-emerald-500">{m.growth}</span>}
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg`}>
              <Icon name={m.icon} size={22} />
            </div>
          </FilterItem>
        ))}
      </FilterContainer>

      {/* Analytics */}
      <AnalyticsSection stats={stats} loading={statsLoading} />

      {/* My NPS */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('myNpsTitle')}</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('myNpsSubtitle')}</p>
        </div>
        {!nps || nps.responseCount === 0 ? (
          <p className="text-xs text-slate-400 font-semibold">{t('npsNoData')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-center">
              <p className="text-[10px] font-bold text-amber-400 uppercase">NPS</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{nps.nps ?? '—'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
              <p className="text-[10px] font-bold text-emerald-400 uppercase">{t('npsPromoters')}</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{nps.promoters}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{t('npsPassives')}</p>
              <p className="text-2xl font-extrabold text-slate-600 dark:text-slate-300">{nps.passives}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-center">
              <p className="text-[10px] font-bold text-red-400 uppercase">{t('npsDetractors')}</p>
              <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{nps.detractors}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-4">{t('quickActions')}</h3>
        <FilterContainer className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {quickActions.map((qa, idx) => (
            <FilterItem key={qa.href} index={idx}>
              <Link
                href={qa.href}
                className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-5 flex flex-col items-center gap-3 text-center hover:border-amber-400 hover:shadow-lg transition group"
              >
                <div className={`w-11 h-11 rounded-2xl ${qa.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition`}>
                  <Icon name={qa.icon} size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{qa.label}</span>
              </Link>
            </FilterItem>
          ))}
        </FilterContainer>
      </div>

      {/* Pending Job Requests */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pendingApprovals')}</h3>
        {loading && <p className="text-xs text-slate-400 font-semibold">{t('loadingRequests')}</p>}
        {!loading && pending.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">{t('noPendingRequests')}</p>
        )}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {pending.map((b, idx) => (
            <FilterItem
              key={b.id}
              index={idx}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{b.serviceTitle}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{t('newRequest')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={getAvatarUrl(b.clientId, b.clientName)} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.clientName}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('scheduleAddressLine', {
                    date: new Date(b.scheduledAt).toLocaleDateString(),
                    time: new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    address: [cityName(b.cityId), b.addressDistrict, b.addressLine].filter(Boolean).join(', ') || '—',
                  })}
                </p>
                {b.clientNote && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">{t('clientNoteLabel', { note: b.clientNote })}</p>
                )}
                {b.contactPhone && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {b.contactPhone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={actingId === b.id}
                  onClick={() => handleDecline(b.id)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50"
                >
                  {t('decline')}
                </button>
                <button
                  disabled={actingId === b.id}
                  onClick={() => handleAccept(b.id)}
                  className="btn-success px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {t('acceptJob', { price: money(b.price) })}
                </button>
              </div>
            </FilterItem>
          ))}
        </div>
      </div>

      {/* Upcoming + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Bookings */}
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('upcomingJobs')}</h3>
          {!loading && upcoming.length === 0 && (
            <p className="text-xs text-slate-400 font-semibold">{t('noUpcomingJobs')}</p>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcoming.map((b, idx) => (
              <FilterItem key={b.id} index={idx} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{b.serviceTitle}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(b.scheduledAt).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' • '}
                    {new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {b.clientName} {b.contactPhone ? `• ${b.contactPhone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{money(b.price)}</span>
                  <button
                    disabled={actingId === b.id}
                    onClick={() => handleStart(b.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition disabled:opacity-50"
                  >
                    {t('startJob')}
                  </button>
                </div>
              </FilterItem>
            ))}
          </div>
        </div>

        {/* Weekly Schedule Preview */}
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('weeklySchedule')}</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportSchedule}
                disabled={exportingSchedule}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 disabled:opacity-60 flex items-center gap-1.5"
              >
                <Icon name="calendar" size={13} />
                {exportingSchedule ? t('exportingSchedule') : t('exportSchedule')}
              </button>
              <Link href="/settings/schedule" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
                {t('editSchedule')}
              </Link>
            </div>
          </div>
          {orderedSchedule.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold">{t('noScheduleSet')}</p>
          ) : (
            <div className="space-y-2">
              {nextDays.map((d, idx) => {
                const day = dayFor(d);
                return (
                  <FilterItem
                    key={d.toISOString()}
                    index={idx}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl ${
                      day ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{weekdays.ofDate(d)}</p>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{d.getDate()}</p>
                      </div>
                      <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">
                        {WEEKDAYS[d.getDay()]}
                      </span>
                    </div>
                    {day ? (
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {day.startTime.slice(0, 5)} – {day.endTime.slice(0, 5)}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{t('dayOff')}</span>
                    )}
                  </FilterItem>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </DashboardLayout>
  );
}
