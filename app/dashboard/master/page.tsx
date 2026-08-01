'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi, citiesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Booking, City } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

export default function MasterDashboardPage() {
  const t = useTranslations('dashboardMaster');
  const { user } = useAuth();
  const masterProfile = user?.masterProfile;

  const [pending, setPending] = useState<Booking[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    citiesApi.list().then((list) => setCities(list)).catch(() => setCities([]));
  }, []);

  const cityName = (cityId?: string | null) => (cityId ? cities.find((c) => c.id === cityId)?.name : undefined);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.list({ status: 'PENDING', limit: 10 });
      setPending(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

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

  const metrics = [
    {
      title: t('metricJobsCompleted'),
      value: t('metricJobsCompletedValue', { count: masterProfile?.completedBookingsCount ?? 0 }),
      growth: '',
      icon: 'CheckCircle2',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: t('metricCustomerRating'),
      value: masterProfile ? `${masterProfile.ratingAverage} / 5` : '—',
      growth: masterProfile ? `${masterProfile.ratingCount} reviews` : '',
      icon: 'Star',
      color: 'from-yellow-500 to-amber-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
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
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <FilterContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <FilterItem key={idx} index={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
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

      {/* Approval Status */}
      {masterProfile && (
        <div className="bg-gradient-to-r from-amber-900/40 via-slate-900 to-slate-900 p-6 rounded-3xl border border-amber-800/40 shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs text-white">
            <span className="font-bold">{t('profileCompletionLabel')}</span>
            <span className="font-extrabold text-amber-400">
              {masterProfile.approvalStatus === 'APPROVED' ? (masterProfile.isActive ? 'Active' : 'Inactive') : masterProfile.approvalStatus}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
              style={{ width: masterProfile.approvalStatus === 'APPROVED' ? '100%' : '50%' }}
            />
          </div>
          <p className="text-[11px] text-slate-300">
            {masterProfile.approvalStatus === 'APPROVED' ? t('profileCompletionDesc') : 'Your profile is pending admin verification.'}
          </p>
        </div>
      )}

      {/* Pending Job Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pendingApprovals')}</h3>
        {loading && <p className="text-xs text-slate-400 font-semibold">Loading pending requests…</p>}
        {!loading && pending.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">No pending requests right now.</p>
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
                  <img src={getAvatarUrl(b.clientId)} alt="" className="w-6 h-6 rounded-full object-cover" />
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {t('acceptJob', { price: b.price })}
                </button>
              </div>
            </FilterItem>
          ))}
        </div>
      </div>

    </div>
  );
}
