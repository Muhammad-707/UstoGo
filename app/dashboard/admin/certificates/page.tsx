'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { adminApi, filesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AdminCertificate } from '@/lib/api/types';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminCertificatesPage() {
  const t = useTranslations('adminCertificates');
  useRequireAuth(['ADMIN']);

  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.certificates.list({
        verified: filter === 'all' ? undefined : filter === 'verified',
        page,
        limit: 20,
      });
      setCertificates(res.items);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches certificates on filter/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const handleView = async (fileId: string) => {
    try {
      const { url } = await filesApi.url(fileId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the file.');
    }
  };

  const handleVerify = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.certificates.verify(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to verify certificate.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.certificates.reject(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reject certificate.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title={t('title')}
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

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-2">
          {(['pending', 'verified', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f === 'pending' ? t('filterPending') : f === 'verified' ? t('filterVerified') : t('filterAll')}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && certificates.length === 0 && (
          <EmptyState icon="award" title={t('noResults')} />
        )}

        {!loading && certificates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{c.title}</p>
                    <p className="text-[11px] text-slate-500">{c.masterDisplayName}</p>
                  </div>
                  {c.verifiedAt && (
                    <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                      {t('verified')}
                    </span>
                  )}
                </div>
                {c.issuedBy && <p className="text-[11px] text-slate-400">{t('issuedBy', { issuer: c.issuedBy })}</p>}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleView(c.fileId)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                  >
                    {t('viewFile')}
                  </button>
                  {!c.verifiedAt && (
                    <>
                      <button
                        onClick={() => handleVerify(c.id)}
                        disabled={actingId === c.id}
                        className="btn-success px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60 transition"
                      >
                        {t('verify')}
                      </button>
                      <button
                        onClick={() => handleReject(c.id)}
                        disabled={actingId === c.id}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-60 transition"
                      >
                        {t('reject')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('prev')}
            </button>
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: totalPages })}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
