'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Briefcase,
  CalendarDays,
  CircleCheckBig,
  Clock,
  CreditCard,
  Download,
  Image as ImageIcon,
  Inbox,
  MapPin,
  Phone,
  Play,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { useWeekdays, useDateFormat } from '@/lib/datetime';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { bookingsApi, citiesApi, masterCabinetApi, mastersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { downloadFile } from '@/lib/api/download';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { getBookingsSocket } from '@/lib/bookings/socket';
import { useMoney } from '@/lib/money';
import { formatE164 } from '@/lib/phone';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Booking, City, MasterNps, MasterStats, MasterStatus, WorkingDay } from '@/lib/api/types';
import { MASTER_CABINET_IMAGES, getAvatarUrl } from '@/lib/placeholders';
import { FilterItem } from '@/components/ui/FilterAnimate';
import { MetricGrid, type Metric } from '@/components/dashboard/MetricCard';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { CabinetCta } from '@/components/dashboard/CabinetCta';
import { AnalyticsSection } from '@/components/master/AnalyticsSection';
import { MasterIdentityPanel } from '@/components/master/MasterIdentityPanel';
import { EarningsSpotlight } from '@/components/master/EarningsSpotlight';
import { MasterQuickActions, type MasterQuickAction } from '@/components/master/MasterQuickActions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const MIN_PORTFOLIO_PHOTOS = 3;

export default function MasterDashboardPage() {
  const t = useTranslations('dashboardMaster');
  const tc = useTranslations('common');
  const fmt = useDateFormat();
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
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [stats, setStats] = useState<MasterStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [nps, setNps] = useState<MasterNps | null>(null);
  const [status, setStatus] = useState<MasterStatus | null>(null);
  const [togglingInstantBook, setTogglingInstantBook] = useState(false);

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
      setError(err instanceof ApiError ? err.message : t('errInstantBook'));
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
      setError(err instanceof ApiError ? err.message : t('errLoadBookings'));
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
      setError(err instanceof ApiError ? err.message : t('errAccept'));
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
      setError(err instanceof ApiError ? err.message : t('errDecline'));
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
        setError(err instanceof ApiError ? err.message : t('errStartJob'));
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
      setError(err instanceof ApiError ? err.message : t('errAvailability'));
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

  const metrics: Metric[] = [
    {
      label: t('metricJobsCompleted'),
      value: masterProfile?.completedBookingsCount ?? 0,
      Icon: CircleCheckBig,
      tone: 'emerald',
    },
    {
      label: t('metricCustomerRating'),
      value: masterProfile ? Number(masterProfile.ratingAverage) : 0,
      decimals: 1,
      suffix: ' / 5',
      hint: `${masterProfile?.ratingCount ?? 0} ${t('reviewsCount')}`,
      Icon: Star,
      tone: 'amber',
      href: '/reviews',
    },
    {
      label: t('metricActiveServices'),
      value: activeServicesCount,
      hint: t('metricActiveServicesSub'),
      Icon: Briefcase,
      tone: 'blue',
      href: '/settings/services',
    },
    {
      label: t('metricUpcomingJobs'),
      value: upcoming.length,
      hint: t('metricUpcomingJobsSub'),
      Icon: CalendarDays,
      tone: 'violet',
    },
  ];

  /** Four, with a line of copy and a photograph each — the shape the client feed uses.
      Ten bare labels duplicated the sidebar and told a master nothing they did not
      already know. */
  const quickActions: MasterQuickAction[] = [
    {
      href: '/settings/services',
      label: t('qaServices'),
      description: t('qaServicesDesc'),
      Icon: Briefcase,
      tile: 'from-blue-600 to-sky-500 shadow-blue-500/25',
      image: MASTER_CABINET_IMAGES.services,
    },
    {
      href: '/settings/schedule',
      label: t('qaSchedule'),
      description: t('qaScheduleDesc'),
      Icon: Clock,
      tile: 'from-sky-500 to-cyan-400 shadow-sky-500/25',
      image: MASTER_CABINET_IMAGES.schedule,
    },
    {
      href: '/settings/portfolio',
      label: t('qaPortfolio'),
      description: t('qaPortfolioDesc'),
      Icon: ImageIcon,
      tile: 'from-violet-600 to-fuchsia-500 shadow-violet-500/25',
      image: MASTER_CABINET_IMAGES.portfolio,
    },
    {
      href: '/payments',
      label: t('qaPayments'),
      description: t('qaPaymentsDesc'),
      Icon: CreditCard,
      tile: 'from-emerald-600 to-teal-500 shadow-emerald-500/25',
      image: MASTER_CABINET_IMAGES.payments,
    },
  ];

  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayFor = (date: Date) => schedule.find((d) => d.weekday === date.getDay());

  const missingAvatar = avatarUrl === null;
  const missingPortfolio = portfolioCount !== null && portfolioCount < MIN_PORTFOLIO_PHOTOS;
  const profileIncomplete = portfolioCount !== null && (missingAvatar || missingPortfolio);
  const unfinishedJobsCount = (stats?.pendingCount ?? 0) + (stats?.acceptedCount ?? 0);

  return (
    <DashboardLayout
      role="MASTER"
      title={t('title')}
      subtitle={t('overview')}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            asChild
            size="raw"
            variant="unstyled"
            className="gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-sky-400"
          >
            <Link href="/settings/schedule">
              <Clock size={15} strokeWidth={1.75} />
              {t('manageSchedule')}
            </Link>
          </Button>
          <Button
            asChild
            size="raw"
            variant="unstyled"
            className="gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Link href="/settings/services">
              <Briefcase size={15} strokeWidth={1.75} />
              {t('editServices')}
            </Link>
          </Button>
        </div>
      }
    >
      {(error || (!statsLoading && unfinishedJobsCount > 0) || profileIncomplete) && (
        <div className="space-y-3">
          {error && <Notice tone="danger">{error}</Notice>}
          {!statsLoading && unfinishedJobsCount > 0 && (
            <Notice tone="info" Icon={Clock}>
              {t('unfinishedJobsWarning', { count: unfinishedJobsCount })}
            </Notice>
          )}
          {profileIncomplete && (
            <Notice
              tone="warning"
              Icon={Award}
              actionLabel={t('incompleteProfileCta')}
              actionHref="/settings/profile"
            >
              {t('incompleteProfileNotice', { count: MIN_PORTFOLIO_PHOTOS })}
            </Notice>
          )}
        </div>
      )}

      {masterProfile && (
        <MasterIdentityPanel
          profile={masterProfile}
          avatarUrl={avatarUrl}
          cityName={cityName(masterProfile.cityId)}
          status={status}
          togglingActive={togglingActive}
          togglingInstantBook={togglingInstantBook}
          onToggleActive={handleToggleAvailability}
          onToggleInstantBook={handleToggleInstantBook}
        />
      )}

      {/* Moderation feedback — the only place a rejected master learns why and can act.
          `POST /masters/me/resubmit` has no other caller, so dropping this button
          strands them. */}
      {masterProfile && masterProfile.approvalStatus !== 'APPROVED' && (
        <Panel
          Icon={masterProfile.approvalStatus === 'REJECTED' ? Award : Clock}
          accent={masterProfile.approvalStatus === 'REJECTED' ? 'rose' : 'amber'}
          title={
            masterProfile.approvalStatus === 'REJECTED'
              ? t('moderationRejectedTitle')
              : t('moderationPendingTitle')
          }
          description={
            masterProfile.approvalStatus === 'REJECTED'
              ? t('moderationRejectedHint')
              : t('moderationPendingHint')
          }
        >
          {masterProfile.rejectionReason && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-500">
                {t('moderationReasonLabel')}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                {masterProfile.rejectionReason}
              </p>
            </div>
          )}

          {masterProfile.approvalStatus === 'REJECTED' && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                size="raw"
                variant="unstyled"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Link href="/settings/profile">{t('moderationEditProfile')}</Link>
              </Button>
              <Button
                size="raw"
                variant="unstyled"
                onClick={handleResubmit}
                disabled={resubmitting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-60"
              >
                {resubmitting ? '…' : t('moderationResubmit')}
              </Button>
            </div>
          )}
        </Panel>
      )}

      <section className="space-y-5">
        <SectionHeading accent="blue" EyebrowIcon={Sparkles} eyebrow={t('overviewEyebrow')} title={t('overview')} />
        <MetricGrid metrics={metrics} />
        <EarningsSpotlight stats={stats} loading={statsLoading} />
      </section>

      <section className="space-y-5">
        <SectionHeading
          accent="blue"
          EyebrowIcon={Wrench}
          eyebrow={t('qaSectionEyebrow')}
          title={tc('quickActions')}
          description={t('qaSectionDesc')}
        />
        <MasterQuickActions actions={quickActions} />
      </section>

      <Panel
        Icon={Inbox}
        accent="blue"
        title={t('pendingApprovals')}
        padding="none"
        divided
        action={
          pending.length > 0 ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-blue-700 dark:bg-blue-500/10 dark:text-sky-400">
              {pending.length}
            </span>
          ) : undefined
        }
      >
        {loading && (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && pending.length === 0 && (
          <EmptyState variant="inline" icon="clock" title={t('noPendingRequests')} />
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {pending.map((b, idx) => (
            <FilterItem key={b.id} index={idx}>
              <article className="px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6 dark:hover:bg-slate-800/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={getAvatarUrl(b.clientId, b.clientName)}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
                        {b.serviceTitle}
                      </p>
                      <p className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">{b.clientName}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-semibold tabular-nums tracking-[-0.02em] text-slate-900 dark:text-white">
                      {money(b.price)}
                    </p>
                    <span className="text-[12px] text-blue-600 dark:text-sky-400">{t('newRequest')}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} strokeWidth={1.75} className="shrink-0 text-slate-400" />
                    {fmt.date(b.scheduledAt)} · {fmt.time(b.scheduledAt)}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                      {[cityName(b.cityId), b.addressDistrict, b.addressLine].filter(Boolean).join(', ') || '—'}
                    </span>
                  </span>
                  {b.contactPhone && (
                    <a
                      href={`tel:${b.contactPhone}`}
                      className="inline-flex items-center gap-1.5 text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                    >
                      <Phone size={14} strokeWidth={1.75} className="shrink-0" />
                      {formatE164(b.contactPhone)}
                    </a>
                  )}
                </div>

                {b.clientNote && (
                  <p className="mt-3 rounded-2xl bg-slate-900/[0.03] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">
                    {t('clientNoteLabel', { note: b.clientNote })}
                  </p>
                )}

                <div className="mt-3.5 flex items-center gap-2">
                  <Button
                    size="raw"
                    variant="unstyled"
                    disabled={actingId === b.id}
                    onClick={() => handleDecline(b.id)}
                    className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-rose-500/10"
                  >
                    {t('decline')}
                  </Button>
                  <Button
                    size="raw"
                    variant="unstyled"
                    disabled={actingId === b.id}
                    onClick={() => handleAccept(b.id)}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {t('acceptShort')}
                  </Button>
                </div>
              </article>
            </FilterItem>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Panel
          Icon={CalendarDays}
          accent="blue"
          title={t('upcomingJobs')}
          padding="none"
          divided
          action={
            upcoming.length > 0 ? (
              <span className="rounded-full bg-slate-900/[0.05] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {upcoming.length}
              </span>
            ) : undefined
          }
        >
          {loading && (
            <div className="space-y-2.5 p-5 sm:p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          )}

          {!loading && upcoming.length === 0 && (
            <EmptyState variant="inline" icon="calendar" title={t('noUpcomingJobs')} />
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcoming.map((b, idx) => {
              const when = new Date(b.scheduledAt);
              return (
                <FilterItem key={b.id} index={idx}>
                  <div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-6 dark:hover:bg-slate-800/30">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-900/[0.04] dark:bg-white/[0.06]">
                      <span className="text-[10px] text-slate-400">{weekdays.short(when.getDay())}</span>
                      <span className="text-[15px] font-semibold leading-none text-slate-900 tabular-nums dark:text-white">
                        {when.getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-slate-900 dark:text-white">{b.serviceTitle}</p>
                      <p className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">
                        {fmt.time(b.scheduledAt)} · {b.clientName}
                        {b.contactPhone ? ` · ${b.contactPhone}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="hidden text-[13.5px] font-semibold tabular-nums text-slate-900 sm:block dark:text-white">
                        {money(b.price)}
                      </span>
                      <Button
                        size="raw"
                        variant="unstyled"
                        disabled={actingId === b.id}
                        onClick={() => handleStart(b.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        <Play size={12} strokeWidth={2} className="fill-current" />
                        {t('startJob')}
                      </Button>
                    </div>
                  </div>
                </FilterItem>
              );
            })}
          </div>
        </Panel>

        <Panel
          Icon={Clock}
          accent="emerald"
          title={t('weeklySchedule')}
          divided
          action={
            <div className="flex items-center gap-1">
              <Button
                size="raw"
                variant="ghost"
                onClick={handleExportSchedule}
                disabled={exportingSchedule}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-60 dark:text-slate-400 dark:hover:text-white"
              >
                <Download size={14} strokeWidth={1.75} />
                {exportingSchedule ? t('exportingSchedule') : t('exportSchedule')}
              </Button>
              <Link
                href="/settings/schedule"
                className="rounded-lg px-2 py-1 text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-sky-400"
              >
                {t('editSchedule')}
              </Link>
            </div>
          }
        >
          {schedule.length === 0 ? (
            <EmptyState variant="inline" icon="clock" title={t('noScheduleSet')} />
          ) : (
            <div className="space-y-1">
              {nextDays.map((d, idx) => {
                const day = dayFor(d);
                const isToday = idx === 0;
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors',
                      isToday
                        ? 'bg-blue-50 dark:bg-blue-500/[0.08]'
                        : 'hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'w-6 text-center text-[14px] font-semibold tabular-nums',
                          isToday ? 'text-blue-700 dark:text-sky-400' : 'text-slate-900 dark:text-white',
                        )}
                      >
                        {d.getDate()}
                      </span>
                      <span className="truncate text-[13.5px] text-slate-600 dark:text-slate-300">
                        {weekdays.long(d.getDay())}
                      </span>
                      {isToday && (
                        <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-sky-400">
                          {t('todayLabel')}
                        </span>
                      )}
                    </div>

                    {day ? (
                      <span className="shrink-0 text-[13px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {day.startTime.slice(0, 5)} – {day.endTime.slice(0, 5)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[13px] text-slate-400">{t('dayOff')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <AnalyticsSection stats={stats} loading={statsLoading} nps={nps} />

      <CabinetCta
        accent="blue"
        eyebrow={t('ctaEyebrow')}
        title={t('ctaTitle')}
        description={t('ctaDesc')}
        primary={{ href: '/settings/profile', label: t('ctaPrimary') }}
        secondary={masterProfile ? { href: `/master/${masterProfile.id}`, label: t('ctaSecondary') } : undefined}
      />
    </DashboardLayout>
  );
}
