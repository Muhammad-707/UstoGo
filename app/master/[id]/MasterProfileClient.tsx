'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Calculator,
  CalendarDays,
  CircleCheckBig,
  Clock,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
  Star,
  Timer,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { useWeekdays } from '@/lib/datetime';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icons/LucideIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { mastersApi, quotesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MasterPublic, MasterService, Review, WorkingDay, MasterCertificatePublic } from '@/lib/api/types';
import { waLink } from '@/lib/whatsapp';
import { getAvatarUrl, getCoverUrl, PLACEHOLDER_REVIEWER_AVATAR } from '@/lib/placeholders';
import { FavoriteButton } from '@/components/masters/FavoriteButton';
import { FilterItem } from '@/components/ui/FilterAnimate';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

type TabId = 'about' | 'services' | 'gallery' | 'reviews' | 'hours';

export default function MasterProfileClient() {
  const t = useTranslations('masterDetail');
  const { money, perHour } = useMoney();
  const weekdays = useWeekdays();
  const locale = useLocale();
  const params = useParams();
  const masterId = params?.id as string;
  const { user } = useAuth();

  const [master, setMaster] = useState<MasterPublic | null>(null);
  const [services, setServices] = useState<MasterService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [certificates, setCertificates] = useState<MasterCertificatePublic[]>([]);
  const [schedule, setSchedule] = useState<WorkingDay[]>([]);
  const [media, setMedia] = useState<{ avatarUrl: string | null; bannerUrl: string | null; portfolio: { fileId: string; caption: string | null; url: string }[] }>({ avatarUrl: null, bannerUrl: null, portfolio: [] });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [activeTab, setActiveTab] = useState<TabId>('about');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteServiceId, setQuoteServiceId] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);

  useEffect(() => {
    if (!masterId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setLoading(true);
    setNotFound(false);
    setLoadError(false);

    mastersApi
      .byId(masterId)
      .then((data) => {
        if (cancelled) return;
        setMaster(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          // Network hiccup, timeout, or a 5xx from a waking-up backend — not the
          // same thing as the master genuinely not existing, so it gets its own
          // retryable error state instead of the "not found" screen.
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    mastersApi.services(masterId).then((data) => {
      if (!cancelled) setServices(data);
    }).catch(() => {});

    mastersApi.reviews(masterId).then((data) => {
      if (!cancelled) setReviews(data.items);
    }).catch(() => {});

    mastersApi.media(masterId).then((data) => {
      if (!cancelled) setMedia(data);
    }).catch(() => {});

    mastersApi.certificates(masterId).then((data) => {
      if (!cancelled) setCertificates(data);
    }).catch(() => {});

    mastersApi.schedule(masterId).then((data) => {
      if (!cancelled) setSchedule(data);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [masterId, reloadKey]);

  useEffect(() => {
    if (!masterId || user?.role !== 'CLIENT') return;
    // Fire-and-forget analytics for GET /masters/me/recently-viewed — never blocks or
    // affects this page, so failures (e.g. a 404 race on a deactivated master) are
    // silently ignored.
    mastersApi.recordView(masterId).catch(() => {});
  }, [masterId, user?.role]);

  const submitQuoteRequest = async () => {
    if (quoteDescription.trim().length < 10) {
      setQuoteError(t('quoteValidationTooShort'));
      return;
    }
    setQuoteSubmitting(true);
    setQuoteError(null);
    try {
      await quotesApi.create({
        masterId,
        serviceId: quoteServiceId || undefined,
        description: quoteDescription.trim(),
      });
      setQuoteSent(true);
    } catch (err) {
      setQuoteError(err instanceof ApiError ? err.message : t('quoteSendFailed'));
    } finally {
      setQuoteSubmitting(false);
    }
  };

  if (loading) {
    /* A skeleton in the shape of the profile, not a centred word. The page is a cover,
       a header card and a two-column body; the placeholder says so, which keeps the
       layout from jumping when the data lands. */
    return (
      <div className="pb-24" aria-busy="true" aria-label={t('loading')}>
        <Skeleton className="h-72 w-full rounded-none sm:h-96" />
        <div className="page-shell relative z-10 -mt-24">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <Skeleton className="-mt-16 h-32 w-32 shrink-0 rounded-3xl sm:-mt-20" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-3.5 w-80" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-52 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError && !master) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xl">
          <Icon name="X" size={48} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('loadErrorTitle')}</h1>
          <p className="text-xs text-slate-500">{t('loadErrorBody')}</p>
        </div>
        <Button size="raw" variant="ghost"
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (notFound || !master) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex items-center justify-center shadow-xl">
          <Icon name="shieldcheck" size={48} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('notFoundTitle')}</h1>
          <p className="text-xs text-slate-500">{t('notFoundBody')}</p>
        </div>
        <Link
          href="/search"
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          {t('backToSearch')}
        </Link>
      </div>
    );
  }

  const avatarUrl = media?.avatarUrl || getAvatarUrl(master.id, master.displayName);
  const bannerUrl = media?.bannerUrl || getCoverUrl(master.id);

  const orderedSchedule = [...schedule].sort((a, b) => {
    const today = new Date().getDay();
    const rot = (w: number) => (w - today + 7) % 7;
    return rot(a.weekday) - rot(b.weekday);
  });

  const weekdayLabel = (weekday: number) => weekdays.long(weekday);

  const formatTime = (time: string) => time.slice(0, 5);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </div>
  );

  /** The four facts a client checks before booking, pulled out of the byline row into
      their own strip. As a run of comma-separated grey text they all weighed the same;
      as a strip the numbers lead and the labels follow. */
  const headlineStats: { value: string; label: string; Icon: LucideIcon; tone: string }[] = [
    {
      value: `${master.ratingAverage}`,
      label: t('statRating'),
      Icon: Star,
      tone: 'text-amber-500',
    },
    {
      value: `${master.completedBookingsCount}`,
      label: t('statJobs'),
      Icon: CircleCheckBig,
      tone: 'text-emerald-500',
    },
    ...(master.yearsOfExperience > 0
      ? [{ value: `${master.yearsOfExperience}`, label: t('statYears'), Icon: Award, tone: 'text-blue-500' }]
      : []),
    ...(master.serviceRadiusKm > 0
      ? [{ value: `${master.serviceRadiusKm} km`, label: t('statRadius'), Icon: MapPin, tone: 'text-violet-500' }]
      : []),
  ];

  const whatsappLink = master.whatsappEnabled && master.whatsappPhone ? waLink(master.whatsappPhone) : null;

  const openQuoteModal = () => {
    setShowQuoteModal(true);
    setQuoteSent(false);
    setQuoteError(null);
    setQuoteDescription('');
    setQuoteServiceId('');
  };

  return (
    <div className="pb-24 space-y-8">

      {/* Cover Image Banner */}
      <div className="relative h-72 w-full overflow-hidden bg-slate-900 sm:h-96">
        <img src={bannerUrl} alt={master.displayName} className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 to-transparent" />

        {/* Way back out of a profile you opened from a results grid. */}
        <div className="page-shell absolute inset-x-0 top-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <ArrowLeft size={14} />
            {t('backToSearch')}
          </Link>
        </div>
      </div>

      <div className="page-shell -mt-28 relative z-10">

        {/* Profile Header Card */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-end">

            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
              <div className="relative -mt-20 sm:-mt-24">
                <img
                  src={avatarUrl}
                  alt={master.displayName}
                  className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-2xl dark:border-slate-900"
                />
                {master.hasCertificates && (
                  <div
                    className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 p-1.5 text-white shadow-lg shadow-blue-600/30"
                    title={t('verifiedMaster')}
                  >
                    <BadgeCheck size={18} strokeWidth={2.4} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                    {master.displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    {master.ratingAverage} ({master.ratingCount})
                  </span>
                  {master.isFastResponder && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Timer size={12} />
                      {t('underMinutes', { count: 30 })}
                    </span>
                  )}
                </div>

                <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 sm:justify-start dark:text-sky-400">
                  <MapPin size={14} />
                  {master.cityName}
                </p>

                {master.categories.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 sm:justify-start">
                    {master.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <FavoriteButton masterId={master.id} />

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-success btn-ripple flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold transition"
                >
                  <MessageCircle size={16} />
                  <span>{t('writeToWhatsApp')}</span>
                </a>
              )}

              <Link
                href={`/booking?master=${master.id}`}
                className="btn-ripple flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
              >
                <CalendarDays size={16} />
                <span>{t('bookAppointment')}</span>
              </Link>

              {user?.role === 'CLIENT' && (
                <Button
                  size="raw"
                  variant="ghost"
                  onClick={openQuoteModal}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-6 py-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Calculator size={16} />
                  <span>{t('requestQuote')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Headline stats */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-4 dark:divide-slate-800 dark:border-slate-800">
            {headlineStats.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  'px-5 py-4 sm:px-6 sm:py-5',
                  // Two per row on mobile means the third cell starts a new row and
                  // must not carry the left divider of the column above it.
                  i === 2 && 'border-t border-slate-100 sm:border-t-0 dark:border-slate-800',
                  i === 3 && 'border-t border-slate-100 sm:border-t-0 dark:border-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <s.Icon size={15} className={cn('shrink-0', s.tone)} />
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {s.value}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Content Layout (Tabs + Sticky Sidebar Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">

            {/* Tab Navigation — a segmented control rather than five underlined words.
                The sliding pill is the same `layoutId` trick as before, moved from a
                2px rule to the pill itself so the active tab reads at a glance. */}
            <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {[
                { id: 'about' as TabId, label: t('tabAbout') },
                { id: 'services' as TabId, label: t('servicesTab', { count: services.length }) },
                { id: 'gallery' as TabId, label: t('tabGallery', { count: media.portfolio.length }) },
                { id: 'reviews' as TabId, label: t('tabReviews', { count: reviews.length }) },
                { id: 'hours' as TabId, label: t('tabHours') },
              ].map((tab) => (
                <Button
                  size="raw"
                  variant="ghost"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold transition-colors',
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="masterProfileTabIndicator"
                      className="absolute inset-0 rounded-xl bg-blue-600 shadow-md shadow-blue-600/25"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </Button>
              ))}
            </div>

            {/* Tab 1: About & Skills */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-fade-in">
                {master.bio && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('professionalBio')}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{master.bio}</p>
                  </div>
                )}

                {master.categories.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Icon name="award" size={20} className="text-blue-600 dark:text-sky-400" />
                      {t('specializations')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {master.categories.map((cat) => (
                        <span key={cat} className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {master.yearsOfExperience > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
                          <Icon name="award" size={20} className="text-amber-500" />
                          <div>
                            <p className="text-xs text-slate-400">{t('experience')}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{master.yearsOfExperience} {t('years')}</p>
                          </div>
                        </div>
                      )}
                      {master.serviceRadiusKm > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
                          <Icon name="mappin" size={20} className="text-blue-600 dark:text-sky-400" />
                          <div>
                            <p className="text-xs text-slate-400">{t('serviceArea')}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{t('serviceRadius', { count: master.serviceRadiusKm })}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Verified Certificates */}
                {certificates.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Icon name="award" size={20} className="text-amber-500" />
                      {t('verifiedCertificates')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{cert.title}</p>
                            {cert.verifiedAt && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
                                <Icon name="checkcircle2" size={11} />
                                {t('verified')}
                              </span>
                            )}
                          </div>
                          {cert.issuedBy && (
                            <p className="text-xs text-slate-500">{t('issuedBy', { issuer: cert.issuedBy })}</p>
                          )}
                          {cert.issuedAt && (
                            <p className="text-[11px] text-slate-400">{new Date(cert.issuedAt).getFullYear()}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!master.bio && master.categories.length === 0 && certificates.length === 0 && (
                  <EmptyState icon="user" title={t('noAbout')} description={t('noAboutDesc')} />
                )}
              </div>
            )}

            {/* Tab 2: Services */}
            {activeTab === 'services' && (
              <div className="space-y-4 animate-fade-in">
                {services.length === 0 ? (
                  <EmptyState icon="briefcase" title={t('noServices')} description={t('noServicesDesc')} />
                ) : (
                  services.map((s, idx) => (
                    <Card key={s.id} asChild>
                      <FilterItem
                     
                      index={idx}
                      className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:shadow-lg hover:border-blue-200 dark:hover:border-sky-900 transition-[box-shadow,border-color] duration-300"
                    >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h4>
                          {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                          <p className="text-xs text-slate-400 mt-1">{s.durationMinutes} {t('minutes')}</p>
                        </div>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          {money(s.price)}
                        </span>
                      </FilterItem>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Tab: Gallery */}
            {activeTab === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {media.portfolio.length === 0 ? (
                  <div className="sm:col-span-2">
                    <EmptyState icon="image" title={t('noGallery')} description={t('noGalleryDesc')} />
                  </div>
                ) : (
                  media.portfolio.map((item, idx) => (
                    <FilterItem
                      key={item.fileId}
                      index={idx % 2}
                      /* First shot spans both columns: a portfolio opens with its best
                         piece, and a uniform grid of six equal squares says nothing
                         about which one that is. */
                      className={cn(
                        'group relative overflow-hidden rounded-3xl border border-slate-200 shadow-md dark:border-slate-800',
                        idx === 0 ? 'h-80 sm:col-span-2' : 'h-60'
                      )}
                    >
                      <img
                        src={item.url}
                        alt={item.caption || t('gallerySampleAlt', { index: idx + 1 })}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="text-sm font-bold text-white">{item.caption}</p>
                        </div>
                      )}
                    </FilterItem>
                  ))
                )}
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fade-in">
                {reviews.length === 0 ? (
                  <EmptyState icon="star" title={t('noReviews')} description={t('noReviewsDesc')} />
                ) : (
                  reviews.map((rev, idx) => (
                    <FilterItem key={rev.id} index={idx}>
                      <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        {/* Same quote mark as /reviews so a review looks like a review
                            wherever it is shown. */}
                        <Quote
                          size={64}
                          strokeWidth={1.5}
                          className="pointer-events-none absolute -right-2 -top-3 text-slate-100 dark:text-slate-800/70"
                        />

                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={PLACEHOLDER_REVIEWER_AVATAR}
                              alt=""
                              className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-900"
                            />
                            <div className="leading-tight">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {rev.clientName ?? t('anonymousClient')}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString(locale)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 dark:bg-amber-500/10">
                            {renderStars(Number(rev.rating))}
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="relative mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {rev.comment}
                          </p>
                        )}

                        {rev.reply && (
                          <div className="relative mt-4 space-y-1.5 rounded-2xl border-l-[3px] border-blue-500 bg-blue-50/70 p-4 dark:bg-slate-800/70">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-sky-400">
                              {t('responseFrom', { name: master.displayName })}
                            </span>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{rev.reply.body}</p>
                          </div>
                        )}
                      </article>
                    </FilterItem>
                  ))
                )}
              </div>
            )}

            {/* Tab: Working Hours */}
            {activeTab === 'hours' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="clock" size={20} className="text-blue-600 dark:text-sky-400" />
                    {t('weeklyAvailability')}
                  </h3>
                  {orderedSchedule.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('noSchedule')}</p>
                  ) : (
                    <div className="space-y-2">
                      {orderedSchedule.map((day) => (
                        <div key={`${day.weekday}-${day.startTime}`} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{weekdayLabel(day.weekday)}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatTime(day.startTime)} – {formatTime(day.endTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sticky Booking Sidebar Card */}
          <div>
            <div className="sticky top-[88px] space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative space-y-6 p-6">
                  {/* The price is the reason this card exists, so it gets its own block
                      rather than sharing a row with its own label. */}
                  <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t('hourlyRate')}
                    </span>
                    <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {master.priceFrom ? perHour(master.priceFrom) : '—'}
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { Icon: ShieldCheck, label: t('serviceGuarantee'), value: t('insured') },
                      { Icon: Clock, label: t('avgResponseTime'), value: t('underMinutes', { count: 30 }) },
                      { Icon: Wallet, label: t('travelFee'), value: t('free') },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <row.Icon size={14} className="shrink-0 text-slate-400" />
                          {row.label}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    <Link
                      href={`/booking?master=${master.id}`}
                      className="btn-ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
                    >
                      <CalendarDays size={18} />
                      <span>{t('bookThisMaster')}</span>
                    </Link>

                    {user?.role === 'CLIENT' && (
                      <Button
                        size="raw"
                        variant="ghost"
                        onClick={openQuoteModal}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Calculator size={15} />
                        <span>{t('requestQuote')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Platform guarantee, stated once next to the button that commits money. */}
              <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/60 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={14} />
                  {t('trustTitle')}
                </h3>
                <ul className="mt-3 space-y-2">
                  {[t('trustPoint1'), t('trustPoint2'), t('trustPoint3')].map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-[11px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300"
                    >
                      <CircleCheckBig size={13} className="mt-px shrink-0 text-emerald-500" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>

      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent showCloseButton={!quoteSent} className="gap-4">
            {quoteSent ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <Icon name="checkcircle2" size={22} />
                </div>
                <DialogHeader className="space-y-1 pr-0 items-center text-center">
                  <DialogTitle className="text-base">{t('quoteSentTitle')}</DialogTitle>
                  <DialogDescription>{t('quoteSentBody')}</DialogDescription>
                </DialogHeader>
                <Button asChild variant="link" className="h-auto p-0 mt-2 text-xs font-bold text-blue-600 dark:text-sky-400">
                  <Link href="/quotes">{t('viewMyQuotes')}</Link>
                </Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{t('requestQuoteTitle')}</DialogTitle>
                </DialogHeader>
                {services.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-service">{t('quoteServiceLabel')}</Label>
                    <Select
                      value={quoteServiceId || ANY}
                      onValueChange={(value) => setQuoteServiceId(value === ANY ? '' : value)}
                    >
                      <SelectTrigger id="quote-service" className="p-3 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>{t('quoteServiceAny')}</SelectItem>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="quote-description">{t('quoteDescriptionLabel')}</Label>
                  <Textarea
                    id="quote-description"
                    value={quoteDescription}
                    onChange={(e) => setQuoteDescription(e.target.value)}
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    placeholder={t('quoteDescriptionPlaceholder')}
                    className="p-3 rounded-xl font-semibold"
                  />
                </div>
                {quoteError && <p className="text-xs font-bold text-red-600 dark:text-red-400">{quoteError}</p>}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-auto px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {t('cancelAction')}
                    </Button>
                  </DialogClose>
                  <Button
                    variant="brand"
                    onClick={submitQuoteRequest}
                    disabled={quoteSubmitting}
                    className="h-auto px-5 py-2.5 rounded-xl text-xs shadow"
                  >
                    {quoteSubmitting ? t('sendingQuote') : t('sendQuoteRequest')}
                  </Button>
                </DialogFooter>
              </>
            )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
