'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheckBig, Clock, Heart, MapPin, Wallet } from 'lucide-react';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';

import { useMoney } from '@/lib/money';
import { bookingsApi, mastersApi, referralApi, reviewsApi } from '@/lib/api/endpoints';
import { getBookingsSocket } from '@/lib/bookings/socket';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';
import type { Booking, MasterPublic, MyReferral } from '@/lib/api/types';
import { InViewRow } from '@/components/ui/FilterAnimate';
import { MetricGrid, type Metric } from '@/components/dashboard/MetricCard';
import { CabinetCta } from '@/components/dashboard/CabinetCta';
import { CabinetHero } from '@/components/dashboard/CabinetHero';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useDateFormat } from '@/lib/datetime';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

export default function ClientDashboardPage() {
  const t = useTranslations('dashboardClient');
  const fmt = useDateFormat();
  const te = useTranslations('enums');
  const { money } = useMoney();
  useRequireAuth(['CLIENT']);
  const { favoriteIds } = useFavorites();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [mastersMap, setMastersMap] = useState<Record<string, MasterPublic>>({});

  const [selectedMaster, setSelectedMaster] = useState<MasterPublic | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [referral, setReferral] = useState<MyReferral | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<MasterPublic[]>([]);
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    reviewsApi
      .myReviews()
      .then((res) => setReviewedBookingIds(new Set(res.items.map((r) => r.bookingId))))
      .catch(() => setReviewedBookingIds(new Set()));
    referralApi.mine().then(setReferral).catch(() => setReferral(null));
    mastersApi.myRecentlyViewed().then(setRecentlyViewed).catch(() => setRecentlyViewed([]));
  }, []);

  const referralLink = referral && typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register/client?ref=${referral.code}`
    : '';

  const handleCopyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  useEffect(() => {
    bookingsApi
      .list({ limit: 20 })
      .then((res) => setBookings(res.items))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const masterIds = [...new Set(bookings.map((b) => b.masterId))];
    if (masterIds.length === 0) return;
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
      .catch(() => {});
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
  const unreviewedCompleted = completed.filter((b) => !reviewedBookingIds.has(b.id));

  const metrics: Metric[] = [
    { label: t('metricTotalSpent'), value: money(totalSpent), Icon: Wallet, tone: 'blue' },
    { label: t('metricActiveBookings'), value: active.length, Icon: Clock, tone: 'amber', href: '/booking' },
    { label: t('metricCompletedProjects'), value: completed.length, Icon: CircleCheckBig, tone: 'emerald' },
    { label: t('metricSavedMasters'), value: favoriteIds.length, Icon: Heart, tone: 'violet', href: '/favorites' },
  ];

  /** The one booking happening right now, if there is one — everything else can wait. */
  const inProgress = bookings.find((b) => b.status === 'IN_PROGRESS') ?? null;

  const visibleBookings =
    bookingFilter === 'ALL'
      ? bookings
      : bookingFilter === 'ACTIVE'
        ? active
        : completed;

  return (
    <DashboardLayout role="CLIENT" title={t('title')} subtitle={t('overview')}>
<CabinetHero
        accent="blue"
        eyebrow={t('heroEyebrow')}
        title={t('heroGreeting', { name: user?.clientProfile?.firstName || user?.email?.split('@')[0] || '' })}
        description={t('heroDesc')}
        media={
          <span className="relative hidden shrink-0 sm:block">
            <span
              aria-hidden
              className="absolute -inset-1 rounded-[1.4rem] bg-gradient-to-br from-blue-500 to-sky-400 opacity-60 blur dark:opacity-70"
            />
            <img
              src={getAvatarUrl(user?.id ?? '', user?.clientProfile?.firstName ?? '')}
              alt=""
              className="relative h-16 w-16 rounded-2xl border-2 border-white/80 object-cover dark:border-white/25"
            />
          </span>
        }
        stats={[
          { label: t('metricTotalSpent'), value: money(totalSpent), Icon: Wallet },
          { label: t('metricActiveBookings'), value: String(active.length), Icon: Clock },
          { label: t('metricCompletedProjects'), value: String(completed.length), Icon: CircleCheckBig },
          { label: t('metricSavedMasters'), value: String(favoriteIds.length), Icon: Heart },
        ]}
      />

      {unreviewedCompleted.length > 0 && (
        <Notice
          tone="info"
          title={t('recommendTitle')}
          actionLabel={t('recommendCta')}
          actionHref={`/reviews?booking=${unreviewedCompleted[0].id}`}
        >
          {t('recommendSubtitle')}
        </Notice>
      )}

      {/* Live booking spotlight — the one thing on this page that is happening now. */}
      {inProgress && (
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md dark:border-blue-900/60 dark:from-blue-950/50 dark:to-slate-900">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-500/40" />
                <MapPin size={22} className="relative" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700 dark:text-sky-300">
                  {t('activeNow')}
                </p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inProgress.serviceTitle} — {inProgress.masterDisplayName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('activeNowDesc')}</p>
              </div>
            </div>
            <Link
              href={`/booking/${inProgress.id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 sm:w-auto"
            >
              <MapPin size={14} />
              {t('trackLive')}
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-5 pt-2">
        <SectionHeading
          accent="blue"
          eyebrow={t('sectionWorkEyebrow')}
          title={t('overview')}
          href="/booking"
          hrefLabel={t('viewTracker')}
        />
        <MetricGrid metrics={metrics} />
      </div>

      {/* Referral */}
      {referral && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center gap-6 justify-between bg-gradient-to-r from-violet-50/60 to-fuchsia-50/60 dark:from-violet-950/20 dark:to-fuchsia-950/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shrink-0">
              <Icon name="Heart" size={22} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t('referralTitle')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">{t('referralSubtitle')}</p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{referral.referredCount}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('referralStatReferred')}</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{referral.totalBonus}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('referralStatBonus')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-sm text-slate-900 dark:text-white tracking-widest text-center">
              {referral.code}
            </div>
            <Button size="raw" variant="ghost"
              onClick={handleCopyReferralLink}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 text-xs font-bold shadow transition flex items-center justify-center gap-2"
            >
              <Icon name={copied ? 'checkcircle2' : 'filetext'} size={14} />
              {copied ? t('referralCopied') : t('referralCopyLink')}
            </Button>
            {referralLink && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(t('referralShareText', { link: referralLink }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold shadow transition flex items-center justify-center gap-2"
              >
                <Icon name="whatsapp" size={14} />
                {t('referralShareWhatsApp')}
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Recently viewed — the same photo-led card the public master grid uses, so a
          client recognises the people they were just looking at. */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-5 pt-2">
          <SectionHeading
            accent="blue"
            eyebrow={t('recentlyViewedEyebrow')}
            title={t('recentlyViewed')}
            href="/search"
            hrefLabel={t('bookAgain')}
          />
          {/* `py-4` with a matching negative margin: the row scrolls horizontally, which
              makes it clip vertically too, so a card lifting on hover had its top edge
              cut off and the browser flashed a scrollbar — the "jump" this hover used to
              have. The room is reserved instead, and the lift is a shorter, eased one. */}
          <div className="no-scrollbar -mx-1 -my-2 flex gap-5 overflow-x-auto px-1 py-4">
            {recentlyViewed.map((m) => (
              <Link
                key={m.id}
                href={`/master/${m.id}`}
                className="group w-52 shrink-0 transform-gpu overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 motion-reduce:transform-none motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900"
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={m.bannerUrl ?? getCoverUrl(m.id)}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-bold text-amber-400 backdrop-blur-md">
                    ★ {m.ratingAverage}
                  </span>
                </div>
                <div className="relative px-4 pb-4">
                  <img
                    src={m.avatarUrl ?? getAvatarUrl(m.id, m.displayName)}
                    alt={m.displayName}
                    className="-mt-8 h-14 w-14 rounded-2xl border-4 border-white object-cover shadow-lg transition-transform duration-300 group-hover:scale-105 dark:border-slate-900"
                  />
                  <p className="mt-2.5 truncate text-sm font-extrabold text-slate-900 dark:text-white">
                    {m.displayName}
                  </p>
                  <p className="truncate text-xs font-semibold text-blue-600 dark:text-sky-400">{m.cityName}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings Table */}
      <div className="space-y-5 pt-2">
        <SectionHeading accent="blue" eyebrow={t('sectionWorkEyebrow')} title={t('sectionHistoryTitle')} />
        <Panel padding="default" bodyClassName="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{t('recentBookings')}</h3>

          {/* Status pills. The table is the reason this page is opened twice a week and
              it had no way to say "just the ones still running". */}
          {bookings.length > 0 && (
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/70">
              {([
                { key: 'ALL' as const, label: t('filterAll'), count: bookings.length },
                { key: 'ACTIVE' as const, label: t('filterActive'), count: active.length },
                { key: 'COMPLETED' as const, label: t('filterCompleted'), count: completed.length },
              ]).map((f) => (
                <Button
                  key={f.key}
                  size="raw"
                  variant="ghost"
                  onClick={() => setBookingFilter(f.key)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    bookingFilter === f.key
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-sky-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {f.label} ({f.count})
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        )}
        {!loading && bookings.length === 0 && (
          <EmptyState
            icon="Calendar"
            variant="inline"
            title={t('noBookings')}
            actionLabel={t('bookAgain')}
            actionHref="/search"
          />
        )}
        {!loading && bookings.length > 0 && visibleBookings.length === 0 && (
          <EmptyState icon="Calendar" variant="inline" title={t('noBookingsFiltered')} />
        )}

        {!loading && visibleBookings.length > 0 && (
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
                {visibleBookings.map((b, idx) => (
                  <InViewRow key={b.id} index={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => { const m = mastersMap[b.masterId]; if (m) setSelectedMaster(m); }}>
                    <td className="py-4 font-mono font-bold text-blue-600 dark:text-sky-400">{b.bookingNumber}</td>
                    <td className="py-4 text-slate-900 dark:text-white">{b.serviceTitle}</td>
                    <td className="py-4 flex items-center gap-2">
                      <img src={getAvatarUrl(b.masterId, b.masterDisplayName)} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span>{b.masterDisplayName}</span>
                    </td>
                    <td className="py-4 text-slate-500">{fmt.date(b.scheduledAt)}</td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">{money(b.price)}</td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {te(`bookingStatus.${b.status}`)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {b.status === 'COMPLETED' && (
                          <Link
                            href={`/booking?master=${b.masterId}&service=${b.serviceId}`}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('bookAgain')}
                          </Link>
                        )}
                        <Link href={`/booking/${b.id}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {t('details')}
                        </Link>
                      </div>
                    </td>
                  </InViewRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </Panel>
      </div>

      {/* Master Profile Overlay */}
      <Dialog open={!!selectedMaster} onOpenChange={(open) => !open && setSelectedMaster(null)}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {selectedMaster && (
            <>
            {selectedMaster.bannerUrl && (
              <img src={selectedMaster.bannerUrl} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-6 space-y-4">
              <DialogHeader className="flex-row items-center gap-4 -mt-12 space-y-0 pr-0">
                <img src={selectedMaster.avatarUrl ?? getAvatarUrl(selectedMaster.id, selectedMaster.displayName)} alt={selectedMaster.displayName} className="w-20 h-20 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
                <div>
                  <DialogTitle>{selectedMaster.displayName}</DialogTitle>
                  <DialogDescription>{selectedMaster.cityName}</DialogDescription>
                  <p className="text-xs text-amber-500 font-bold">★ {selectedMaster.ratingAverage} ({selectedMaster.ratingCount})</p>
                </div>
              </DialogHeader>

              {selectedMaster.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedMaster.bio}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">{t('masterExperience')}</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{t('yearsShort', { years: selectedMaster.yearsOfExperience })}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">{t('masterServiceRadius')}</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{t('kmShort', { km: selectedMaster.serviceRadiusKm })}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">{t('masterCompleted')}</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{selectedMaster.completedBookingsCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-slate-400 font-bold">{t('masterCategories')}</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{selectedMaster.categories.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              {selectedMaster.whatsappPhone && (
                <Button
                  asChild
                  className="w-full h-auto gap-2 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-xs shadow"
                >
                  <a
                    href={`https://wa.me/${selectedMaster.whatsappPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="whatsapp" size={16} />
                    {t('writeOnWhatsApp')}
                  </a>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full h-auto py-3 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => setSelectedMaster(null)}
              >
                <Link href={`/master/${selectedMaster.id}`}>{t('viewFullProfile')}</Link>
              </Button>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CabinetCta
        accent="blue"
        eyebrow={t('ctaEyebrow')}
        title={t('ctaTitle')}
        description={t('ctaDesc')}
        primary={{ href: '/search', label: t('ctaPrimary') }}
        secondary={{ href: '/marketplace', label: t('ctaSecondary') }}
      />
    </DashboardLayout>
  );
}