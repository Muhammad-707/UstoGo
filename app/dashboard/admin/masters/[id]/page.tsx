'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { adminApi, mastersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { waLink } from '@/lib/whatsapp';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AdminMasterStats, MasterPublic } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const STARS = ['5', '4', '3', '2', '1'] as const;

export default function AdminMasterStatsPage() {
  const t = useTranslations('adminMasterStats');
  useRequireAuth(['ADMIN']);
  const params = useParams<{ id: string }>();
  const masterId = params.id;

  const [master, setMaster] = useState<MasterPublic | null>(null);
  const [stats, setStats] = useState<AdminMasterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    if (!masterId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [m, s] = await Promise.all([mastersApi.byId(masterId), adminApi.masters.stats(masterId)]);
        if (cancelled) return;
        setMaster(m);
        setStats(s);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load master statistics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [masterId]);

  const handleToggleActive = async () => {
    if (!master) return;
    const reason = master.isActive ? window.prompt(t('deactivateReasonPrompt')) : null;
    if (master.isActive && (!reason || reason.trim().length < 10)) return;
    setTogglingActive(true);
    setError(null);
    try {
      if (master.isActive) {
        await adminApi.masters.deactivate(master.id, (reason as string).trim());
      } else {
        await adminApi.masters.activate(master.id);
      }
      // The status endpoints return the profile, not the public projection this page
      // renders, so re-read rather than patching a partially-shaped object in.
      setMaster(await mastersApi.byId(master.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('toggleActiveFailed'));
    } finally {
      setTogglingActive(false);
    }
  };

  const maxBreakdown = stats ? Math.max(...STARS.map((s) => stats.reviewsBreakdown[s]), 1) : 1;
  const maxMonthly = stats && stats.monthlySeries.length ? Math.max(...stats.monthlySeries.map((m) => m.bookings), 1) : 1;

  return (
    <DashboardLayout
      role="ADMIN"
      title={master?.displayName ?? t('title')}
      subtitle={t('subtitle')}
      action={
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition"
        >
          <Icon name="chevronleft" size={14} />
          {t('back')}
        </Link>
      }
    >
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="p-6 border-slate-200 dark:border-slate-800 shadow-xl h-[100px] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && master && stats && (
        <>
          {/* Master header */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <img
                src={master.avatarUrl ?? getAvatarUrl(master.id, master.displayName)}
                alt={master.displayName}
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  {master.displayName}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      master.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {master.isActive ? t('stateActive') : t('stateInactive')}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">{master.cityName}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Moderator suspension — distinct from the master's own vacation toggle;
                  the reason given here is what lands in the audit log. */}
              <Button size="raw" variant="ghost"
                onClick={handleToggleActive}
                disabled={togglingActive}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow transition disabled:opacity-60 ${
                  master.isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-success'
                }`}
              >
                {togglingActive ? '...' : master.isActive ? t('deactivate') : t('activate')}
              </Button>
              {master.whatsappPhone && (
                <a
                  href={waLink(master.whatsappPhone) ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold shadow transition"
                >
                  <Icon name="whatsapp" size={16} />
                  {t('openWhatsApp')}
                </a>
              )}
            </div>
          </Card>

          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { label: t('totalClientsServed'), value: stats.totalClientsServed, icon: 'Users', color: 'from-emerald-500 to-teal-500' },
              { label: t('completedJobs'), value: stats.completedJobs, icon: 'checkcircle2', color: 'from-blue-600 to-sky-500' },
              { label: t('unfinishedJobs'), value: stats.unfinishedJobs, icon: 'clock', color: 'from-amber-500 to-orange-500' },
              { label: t('avgRating'), value: `${stats.avgRating.toFixed(2)} (${stats.ratingCount})`, icon: 'star', color: 'from-purple-600 to-indigo-600' },
              { label: t('npsLabel'), value: stats.nps ?? '—', icon: 'trendingup', color: 'from-rose-500 to-pink-500' },
            ].map((m, idx) => (
              <Card key={idx} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</span>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg`}>
                  <Icon name={m.icon} size={20} />
                </div>
              </Card>
            ))}
          </div>

          {stats.nps !== null && (
            <p className="text-[11px] text-slate-400 font-semibold -mt-2">{t('npsResponses', { count: stats.npsResponseCount })}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Reviews breakdown */}
            <Card className="gap-0 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('reviewsBreakdown')}</h3>
              <div className="space-y-2">
                {STARS.map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-10 flex items-center gap-1">
                      {star} <Icon name="star" size={11} className="fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${(stats.reviewsBreakdown[star] / maxBreakdown) * 100}%` }}
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{stats.reviewsBreakdown[star]}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top services */}
            <Card className="gap-0 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('topServices')}</h3>
              {stats.topServices.length === 0 && <p className="text-xs text-slate-400 font-semibold">{t('noServices')}</p>}
              <div className="space-y-2">
                {stats.topServices.map((svc) => (
                  <div key={svc.serviceId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{svc.title}</p>
                      <p className="text-[10px] text-slate-400">{t('completedCount', { count: svc.completedCount })}</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{svc.revenue}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Monthly series */}
          <Card className="gap-0 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('monthlySeries')}</h3>
            {stats.monthlySeries.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold">{t('noMonthlyData')}</p>
            ) : (
              <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
                {stats.monthlySeries.map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex flex-col items-center gap-0.5">
                      <div
                        style={{ height: `${Math.max((point.completed / maxMonthly) * 140, 4)}px` }}
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg"
                        title={t('completedCount', { count: point.completed })}
                      />
                      <div
                        style={{ height: `${Math.max(((point.bookings - point.completed) / maxMonthly) * 140, 2)}px` }}
                        className="w-full bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-t-lg"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{point.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
