'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { getAvatarUrl } from '@/lib/placeholders';
import type { Paginated, Review } from '@/lib/api/types';

export default function AdminReviewsPage() {
  const t = useTranslations('adminReviews');
  useRequireAuth(['ADMIN']);

  const [result, setResult] = useState<Paginated<Review> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading before an async fetch
    setLoading(true);
    setError(null);
    adminApi.reviews
      .list({ page, limit: 20 })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey]);

  const moderate = async (review: Review, hide: boolean) => {
    if (hide && !window.confirm(t('confirmHide'))) return;
    setActingId(review.id);
    setError(null);
    try {
      if (hide) await adminApi.reviews.hide(review.id);
      else await adminApi.reviews.unhide(review.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('actionFailed'));
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

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
        <p className="text-xs font-bold text-slate-400">
          {result ? t('resultsCount', { count: result.meta.total }) : ''}
        </p>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-36 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && result && result.items.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>
        )}

        {!loading && result && result.items.length > 0 && (
          <FilterContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.items.map((review, idx) => {
              const hidden = review.status === 'HIDDEN';
              return (
                <FilterItem key={review.id} index={idx % 2}>
                  <div
                    className={`p-5 rounded-2xl border space-y-3 h-full ${
                      hidden
                        ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-70'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getAvatarUrl(review.clientId, review.clientName ?? '')}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {review.clientName ?? t('anonymous')}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hidden && (
                          <span className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-extrabold">
                            {t('hidden')}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-500 font-extrabold text-xs">
                          <Icon name="star" size={13} className="fill-amber-400" />
                          {review.rating}.0
                        </span>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                        {review.comment}
                      </p>
                    )}

                    {review.reply && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-blue-600 dark:text-sky-400">{t('masterReply')}: </span>
                        {review.reply.body}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {hidden ? (
                        <button
                          onClick={() => moderate(review, false)}
                          disabled={actingId === review.id}
                          className="btn-success px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60 transition"
                        >
                          {t('unhide')}
                        </button>
                      ) : (
                        <button
                          onClick={() => moderate(review, true)}
                          disabled={actingId === review.id}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-60 transition"
                        >
                          {t('hide')}
                        </button>
                      )}
                      <Link
                        href={`/master/${review.masterId}`}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                      >
                        {t('viewMaster')}
                      </Link>
                    </div>
                  </div>
                </FilterItem>
              );
            })}
          </FilterContainer>
        )}

        {!loading && result && result.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('prev')}
            </button>
            <span className="text-xs font-bold text-slate-500">
              {t('pageOf', { page, total: result.meta.totalPages })}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))}
              disabled={page >= result.meta.totalPages}
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
