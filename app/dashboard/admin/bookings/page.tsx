'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InViewRow } from '@/components/ui/FilterAnimate';
import type { Booking, BookingDetail, BookingStatus, Paginated } from '@/lib/api/types';
import { useMoney } from '@/lib/money';

const STATUSES: BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED_BY_CLIENT',
  'CANCELLED_BY_MASTER',
  'CANCELLED_BY_ADMIN',
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
  ACCEPTED: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  IN_PROGRESS: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
};

const cancellable = (status: string) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(status);

export default function AdminBookingsPage() {
  const t = useTranslations('adminBookings');
  const { money } = useMoney();
  useRequireAuth(['ADMIN']);

  const [result, setResult] = useState<Paginated<Booking> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading before an async fetch
    setLoading(true);
    setError(null);
    adminApi.bookings
      .list({ page, limit: 20, status: status || undefined })
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
  }, [page, status, reloadKey]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await adminApi.bookings.byId(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleForceCancel = async (id: string) => {
    const reason = window.prompt(t('cancelReasonPrompt'));
    if (!reason || reason.trim().length < 10) return;
    setCancelling(true);
    try {
      await adminApi.bookings.cancel(id, reason.trim());
      setDetail(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cancelFailed'));
    } finally {
      setCancelling(false);
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="">{t('allStatuses')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <p className="text-xs font-bold text-slate-400">
            {result ? t('resultsCount', { count: result.meta.total }) : ''}
          </p>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && result && result.items.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>
        )}

        {!loading && result && result.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 font-bold">{t('colNumber')}</th>
                  <th className="pb-3 font-bold">{t('colService')}</th>
                  <th className="pb-3 font-bold hidden md:table-cell">{t('colClient')}</th>
                  <th className="pb-3 font-bold hidden md:table-cell">{t('colMaster')}</th>
                  <th className="pb-3 font-bold">{t('colStatus')}</th>
                  <th className="pb-3 font-bold text-right">{t('colPrice')}</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.items.map((b, idx) => (
                  <InViewRow key={b.id} index={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-200">{b.bookingNumber}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white max-w-[180px] truncate">{b.serviceTitle}</td>
                    <td className="py-3 text-slate-500 hidden md:table-cell">{b.clientName}</td>
                    <td className="py-3 text-slate-500 hidden md:table-cell">{b.masterDisplayName}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold ${STATUS_STYLE[b.status] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-slate-900 dark:text-white">{money(b.price)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openDetail(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        {t('view')}
                      </button>
                    </td>
                  </InViewRow>
                ))}
              </tbody>
            </table>
          </div>
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
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: result.meta.totalPages })}</span>
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

      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading && <p className="text-xs text-slate-400 font-semibold py-8 text-center">{t('loading')}</p>}

            {detail && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono font-extrabold text-purple-600 dark:text-purple-400">
                      {detail.bookingNumber}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{detail.serviceTitle}</h3>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                    <Icon name="x" size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p><span className="font-bold text-slate-400">{t('colClient')}:</span> {detail.clientName}</p>
                  <p><span className="font-bold text-slate-400">{t('colMaster')}:</span> {detail.masterDisplayName}</p>
                  <p><span className="font-bold text-slate-400">{t('colStatus')}:</span> {detail.status}</p>
                  <p><span className="font-bold text-slate-400">{t('colPrice')}:</span> {money(detail.price)}</p>
                  <p className="col-span-2">
                    <span className="font-bold text-slate-400">{t('scheduledLabel')}:</span> {new Date(detail.scheduledAt).toLocaleString()}
                  </p>
                  {detail.addressLine && (
                    <p className="col-span-2"><span className="font-bold text-slate-400">{t('addressLabel')}:</span> {detail.addressLine}</p>
                  )}
                  {detail.paymentConfirmedAt && (
                    <p className="col-span-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      {t('paidLabel')}: {money(detail.paidAmount)}
                    </p>
                  )}
                </div>

                {detail.history.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400">{t('historyLabel')}</span>
                    <div className="space-y-1.5">
                      {detail.history.map((h) => (
                        <div key={h.id} className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{h.status}</span>
                          <span className="text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cancellable(detail.status) && (
                  <button
                    onClick={() => handleForceCancel(detail.id)}
                    disabled={cancelling}
                    className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow disabled:opacity-60 transition"
                  >
                    {cancelling ? '...' : t('forceCancel')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
