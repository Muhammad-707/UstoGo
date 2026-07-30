'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { MASTERS } from '@/lib/mockData';

export default function MasterProfilePage() {
  const t = useTranslations('masterDetail');
  const tc = useTranslations('common');
  const tm = useTranslations('mockData');
  const params = useParams();
  const masterId = params?.id as string;
  const master = MASTERS.find((m) => m.id === masterId) || MASTERS[0];

  const [activeTab, setActiveTab] = useState<'about' | 'gallery' | 'reviews' | 'hours'>('about');

  return (
    <div className="pb-24 space-y-8">
      
      {/* Cover Image Banner */}
      <div className="h-72 sm:h-96 relative w-full overflow-hidden bg-slate-900">
        <img src={master.coverImage} alt={master.name} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-end justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <div className="relative -mt-16 sm:-mt-20">
              <img src={master.avatar} alt={master.name} className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl" />
              {master.verified && (
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg" title={t('verifiedMaster')}>
                  <Icon name="ShieldCheck" size={18} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{master.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  ★ {master.rating} ({master.reviewCount})
                </span>
              </div>

              <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">{tm(`masters.${master.id}.title`)}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Icon name="MapPin" size={14} />
                  {master.location}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Award" size={14} />
                  {t('yearsExperience', { count: master.experienceYears })}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Icon name="CheckCircle2" size={14} />
                  {t('jobsCompleted', { count: master.completedJobs })}
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
                { id: 'gallery', label: t('tabGallery', { count: master.gallery.length }) },
                { id: 'reviews', label: t('tabReviews', { count: master.reviews.length }) },
                { id: 'hours', label: t('tabHours') },
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

            {/* Tab 1: About & Skills */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-fade-in">
                {/* Bio */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('professionalBio')}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{tm(`masters.${master.id}.bio`)}</p>
                </div>

                {/* Specializations & Skills */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('specializations')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {tm.raw(`masters.${master.id}.skills`).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verified Licenses & Certificates */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="Award" size={20} className="text-amber-500" />
                    {t('verifiedCertificates')}
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {master.certificates.map((cert, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cert.title}</h4>
                          <p className="text-xs text-slate-500">{t('issuedBy', { issuer: cert.issuer })}</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                          {cert.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Gallery */}
            {activeTab === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {master.gallery.map((img, idx) => (
                  <div key={idx} className="h-60 rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
                    <img src={img} alt={t('gallerySampleAlt', { index: idx })} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fade-in">
                {master.reviews.map((rev) => (
                  <div key={rev.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={rev.clientAvatar} alt={rev.clientName} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rev.clientName}</h4>
                          <p className="text-xs text-slate-400">{rev.date} • {tm(`masters.${master.id}.reviews.${rev.id}.serviceTitle`)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Icon name="Star" size={14} className="fill-amber-400" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{tm(`masters.${master.id}.reviews.${rev.id}.comment`)}</p>
                    {rev.craftsmanReply && (
                      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <span className="font-bold text-blue-600 dark:text-sky-400">{t('responseFrom', { name: master.name })}</span>
                        <p>{tm(`masters.${master.id}.reviews.${rev.id}.craftsmanReply`)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Working Hours */}
            {activeTab === 'hours' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('weeklyAvailability')}</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {Object.entries(tm.raw(`masters.${master.id}.workingHours`) as Record<string, string>).map(([days, hours], idx) => (
                    <div key={idx} className="py-3 flex justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tc.raw('dayLabels')[days] ?? days}</span>
                      <span className="text-blue-600 dark:text-sky-400 font-bold">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sticky Booking Sidebar Card */}
          <div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">{t('hourlyRate')}</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">${master.hourlyRate}/hr</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{t('serviceGuarantee')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('insured')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('avgResponseTime')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{t('underMinutes', { count: 15 })}</span>
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
