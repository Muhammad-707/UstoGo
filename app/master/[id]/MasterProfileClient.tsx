'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { useWeekdays } from '@/lib/datetime';
import { useMoney } from '@/lib/money';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi, quotesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MasterPublic, MasterService, Review, WorkingDay, MasterCertificatePublic } from '@/lib/api/types';
import { waLink } from '@/lib/whatsapp';
import { getAvatarUrl, getCoverUrl, PLACEHOLDER_REVIEWER_AVATAR } from '@/lib/placeholders';
import { FavoriteButton } from '@/components/masters/FavoriteButton';
import { FilterItem } from '@/components/ui/FilterAnimate';

type TabId = 'about' | 'services' | 'gallery' | 'reviews' | 'hours';

export default function MasterProfileClient() {
  const t = useTranslations('masterDetail');
  const { perHour } = useMoney();
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
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 font-medium">
        {t('loading')}
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
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          {t('retry')}
        </button>
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
    <div className="flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={13} className={i <= Math.round(rating) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'} />
      ))}
    </div>
  );

  return (
    <div className="pb-24 space-y-8">

      {/* Cover Image Banner */}
      <div className="h-72 sm:h-96 relative w-full overflow-hidden bg-slate-900">
        <img src={bannerUrl} alt={master.displayName} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-end justify-between gap-6">

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <div className="relative -mt-16 sm:-mt-20">
              <img src={avatarUrl} alt={master.displayName} className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl" />
              {master.hasCertificates && (
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg" title={t('verifiedMaster')}>
                  <Icon name="shieldcheck" size={18} />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{master.displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  ★ {master.ratingAverage} ({master.ratingCount})
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Icon name="mappin" size={14} />
                  {master.cityName}
                </span>
                {master.yearsOfExperience > 0 && (
                  <span className="flex items-center gap-1">
                    <Icon name="award" size={14} />
                    {t('yearsExperience', { count: master.yearsOfExperience })}
                  </span>
                )}
                {master.serviceRadiusKm > 0 && (
                  <span className="flex items-center gap-1">
                    <Icon name="clock" size={14} />
                    {t('serviceRadius', { count: master.serviceRadiusKm })}
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Icon name="checkcircle2" size={14} />
                  {t('jobsCompleted', { count: master.completedBookingsCount })}
                </span>
              </div>

              {master.categories.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {master.categories.map((cat) => (
                    <span key={cat} className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-[11px] font-bold">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <FavoriteButton masterId={master.id} />

            {master.whatsappEnabled && master.whatsappPhone && (() => {
            const link = waLink(master.whatsappPhone);
            return link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-success px-5 py-3 rounded-2xl text-xs font-extrabold transition btn-ripple flex items-center gap-2"
              >
                <Icon name="whatsapp" size={16} />
                <span>{t('writeToWhatsApp')}</span>
              </a>
            ) : null;
          })()}

            <Link
              href={`/booking?master=${master.id}`}
              className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 transition btn-ripple flex items-center gap-2"
            >
              <Icon name="calendar" size={16} />
              <span>{t('bookAppointment')}</span>
            </Link>

            {user?.role === 'CLIENT' && (
              <button
                onClick={() => {
                  setShowQuoteModal(true);
                  setQuoteSent(false);
                  setQuoteError(null);
                  setQuoteDescription('');
                  setQuoteServiceId('');
                }}
                className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
              >
                <Icon name="calculator" size={16} />
                <span>{t('requestQuote')}</span>
              </button>
            )}
          </div>

        </div>

        {/* Profile Content Layout (Tabs + Sticky Sidebar Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
              {[
                { id: 'about' as TabId, label: t('tabAbout') },
                { id: 'services' as TabId, label: t('servicesTab', { count: services.length }) },
                { id: 'gallery' as TabId, label: t('tabGallery', { count: media.portfolio.length }) },
                { id: 'reviews' as TabId, label: t('tabReviews', { count: reviews.length }) },
                { id: 'hours' as TabId, label: t('tabHours') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm font-bold transition whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-sky-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="masterProfileTabIndicator"
                      className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
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
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-sky-400 mx-auto flex items-center justify-center">
                      <Icon name="user" size={26} />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{t('noAbout')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Services */}
            {activeTab === 'services' && (
              <div className="space-y-4 animate-fade-in">
                {services.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-sky-400 mx-auto flex items-center justify-center">
                      <Icon name="briefcase" size={26} />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{t('noServices')}</p>
                  </div>
                ) : (
                  services.map((s, idx) => (
                    <FilterItem
                      key={s.id}
                      index={idx}
                      className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:shadow-lg hover:border-blue-200 dark:hover:border-sky-900 transition-[box-shadow,border-color] duration-300"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h4>
                        {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                        <p className="text-xs text-slate-400 mt-1">{s.durationMinutes} {t('minutes')}</p>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {s.price} {s.currency}
                      </span>
                    </FilterItem>
                  ))
                )}
              </div>
            )}

            {/* Tab: Gallery */}
            {activeTab === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {media.portfolio.length === 0 ? (
                  <div className="sm:col-span-2 bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-sky-400 mx-auto flex items-center justify-center">
                      <Icon name="image" size={26} />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{t('noGallery')}</p>
                  </div>
                ) : (
                  media.portfolio.map((item, idx) => (
                    <FilterItem
                      key={item.fileId}
                      index={idx % 2}
                      className="h-60 rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 group relative"
                    >
                      <img src={item.url} alt={item.caption || t('gallerySampleAlt', { index: idx + 1 })} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                      {item.caption && (
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <p className="text-xs font-bold text-white">{item.caption}</p>
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
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-sky-400 mx-auto flex items-center justify-center">
                      <Icon name="star" size={26} />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">{t('noReviews')}</p>
                  </div>
                ) : (
                  reviews.map((rev, idx) => (
                    <FilterItem
                      key={rev.id}
                      index={idx}
                      className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={PLACEHOLDER_REVIEWER_AVATAR} alt={rev.clientName ?? ''} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rev.clientName ?? t('anonymousClient')}</h4>
                            <p className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString(locale)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {renderStars(Number(rev.rating))}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{rev.rating}.0</span>
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                      )}
                      {rev.reply && (
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          <span className="font-bold text-blue-600 dark:text-sky-400">{t('responseFrom', { name: master.displayName })}</span>
                          <p>{rev.reply.body}</p>
                        </div>
                      )}
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
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24 space-y-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400" />
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('hourlyRate')}</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {master.priceFrom ? perHour(master.priceFrom) : '—'}
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{t('serviceGuarantee')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('insured')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('avgResponseTime')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('underMinutes', { count: 30 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('travelFee')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('free')}</span>
                </div>
              </div>

              <Link
                href={`/booking?master=${master.id}`}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition btn-ripple flex items-center justify-center gap-2"
              >
                <Icon name="calendar" size={18} />
                <span>{t('bookThisMaster')}</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

      {showQuoteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQuoteModal(false)}
        >
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {quoteSent ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <Icon name="checkcircle2" size={22} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t('quoteSentTitle')}</h3>
                <p className="text-xs text-slate-400">{t('quoteSentBody')}</p>
                <Link
                  href="/quotes"
                  className="inline-block mt-2 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
                >
                  {t('viewMyQuotes')}
                </Link>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('requestQuoteTitle')}</h3>
                {services.length > 0 && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('quoteServiceLabel')}</span>
                    <select
                      value={quoteServiceId}
                      onChange={(e) => setQuoteServiceId(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value="">{t('quoteServiceAny')}</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('quoteDescriptionLabel')}</span>
                  <textarea
                    value={quoteDescription}
                    onChange={(e) => setQuoteDescription(e.target.value)}
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    placeholder={t('quoteDescriptionPlaceholder')}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </label>
                {quoteError && <p className="text-xs font-bold text-red-600 dark:text-red-400">{quoteError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowQuoteModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {t('cancelAction')}
                  </button>
                  <button
                    onClick={submitQuoteRequest}
                    disabled={quoteSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow transition disabled:opacity-60"
                  >
                    {quoteSubmitting ? t('sendingQuote') : t('sendQuoteRequest')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
