'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi, filesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { MasterPublic, MasterService, Review } from '@/lib/api/types';
import { getAvatarUrl, getCoverUrl, PLACEHOLDER_REVIEWER_AVATAR } from '@/lib/placeholders';
import { FilterItem } from '@/components/ui/FilterAnimate';

export default function MasterProfilePage() {
  const t = useTranslations('masterDetail');
  const tc = useTranslations('common');
  const params = useParams();
  const masterId = params?.id as string;

  const [master, setMaster] = useState<MasterPublic | null>(null);
  const [services, setServices] = useState<MasterService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'gallery' | 'reviews'>('about');

  useEffect(() => {
    if (!masterId) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

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

    return () => {
      cancelled = true;
    };
  }, [masterId]);

  useEffect(() => {
    if (!master?.portfolioImageFileIds?.length) {
      setGalleryUrls([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      master.portfolioImageFileIds.map((fileId) => filesApi.url(fileId).then((r) => r.url).catch(() => null))
    ).then((urls) => {
      if (!cancelled) setGalleryUrls(urls.filter((u): u is string => !!u));
    });
    return () => {
      cancelled = true;
    };
  }, [master?.portfolioImageFileIds]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 font-medium">
        Loading master profile...
      </div>
    );
  }

  if (notFound || !master) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex items-center justify-center shadow-xl">
          <Icon name="ShieldCheck" size={48} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Master Not Found</h1>
          <p className="text-xs text-slate-500">
            This master profile does not exist or is no longer available.
          </p>
        </div>
        <Link
          href="/search"
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-8">

      {/* Cover Image Banner */}
      <div className="h-72 sm:h-96 relative w-full overflow-hidden bg-slate-900">
        <img src={getCoverUrl(master.id)} alt={master.displayName} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-end justify-between gap-6">

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <div className="relative -mt-16 sm:-mt-20">
              <img src={getAvatarUrl(master.id)} alt={master.displayName} className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl" />
              {master.hasCertificates && (
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg" title={t('verifiedMaster')}>
                  <Icon name="ShieldCheck" size={18} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{master.displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  ★ {master.ratingAverage} ({master.ratingCount})
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Icon name="MapPin" size={14} />
                  {master.cityName}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Icon name="CheckCircle2" size={14} />
                  {t('jobsCompleted', { count: master.completedBookingsCount })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <Link
              href={`/messages?master=${master.id}`}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <Icon name="MessageSquare" size={16} />
              <span>{t('chat')}</span>
            </Link>

            <Link
              href={`/booking?master=${master.id}`}
              className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 transition btn-ripple flex items-center gap-2"
            >
              <Icon name="Calendar" size={16} />
              <span>{t('bookAppointment')}</span>
            </Link>
          </div>

        </div>

        {/* Profile Content Layout (Tabs + Sticky Sidebar Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
              {[
                { id: 'about', label: t('tabAbout') },
                { id: 'services', label: `Services (${services.length})` },
                { id: 'gallery', label: t('tabGallery', { count: galleryUrls.length }) },
                { id: 'reviews', label: t('tabReviews', { count: reviews.length }) },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 text-sm font-bold transition relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-sky-400 border-b-2 border-blue-600 dark:border-sky-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: About */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-fade-in">
                {/* Bio */}
                {master.bio && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('professionalBio')}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{master.bio}</p>
                  </div>
                )}

                {/* Verified Certificates */}
                {master.hasCertificates && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Icon name="Award" size={20} className="text-amber-500" />
                      {t('verifiedCertificates')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      This master has verified certificates on file.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Services */}
            {activeTab === 'services' && (
              <div className="space-y-4 animate-fade-in">
                {services.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No services listed yet.
                  </div>
                ) : (
                  services.map((s, idx) => (
                    <FilterItem
                      key={s.id}
                      index={idx}
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h4>
                        {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                        <p className="text-xs text-slate-400 mt-1">{s.durationMinutes} min</p>
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
                {galleryUrls.length === 0 ? (
                  <div className="sm:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No portfolio images yet.
                  </div>
                ) : (
                  galleryUrls.map((url, idx) => (
                    <FilterItem
                      key={idx}
                      index={idx % 2}
                      className="h-60 rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800"
                    >
                      <img src={url} alt={`${master.displayName} portfolio ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                    </FilterItem>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fade-in">
                {reviews.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No reviews yet.
                  </div>
                ) : (
                  reviews.map((rev, idx) => (
                    <FilterItem
                      key={rev.id}
                      index={idx}
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={PLACEHOLDER_REVIEWER_AVATAR} alt="Client" className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Client</h4>
                            <p className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Icon name="Star" size={14} className="fill-amber-400" />
                          <span>{rev.rating}.0</span>
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

          </div>

          {/* Sticky Booking Sidebar Card */}
          <div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('hourlyRate')}</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {master.priceFrom ? `$${master.priceFrom}/hr` : 'N/A'}
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{t('serviceGuarantee')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('insured')}</span>
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
                <Icon name="Calendar" size={18} />
                <span>{t('bookThisMaster')}</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
