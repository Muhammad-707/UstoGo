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
import { useDateFormat } from '@/lib/datetime';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

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
  const fmt = useDateFormat();
  const te = useTranslations('enums');
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

      <Card className="gap-0 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Select value={status || ANY} onValueChange={(raw) => { const value = raw === ANY ? '' : raw; setStatus(value); setPage(1); }}>
            <SelectTrigger className="w-auto p-2.5 rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t('allStatuses')}</SelectItem>
            
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
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
          <EmptyState icon="calendar" title={t('noResults')} />
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
                        {te(`bookingStatus.${b.status}`)}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-slate-900 dark:text-white">{money(b.price)}</td>
                    <td className="py-3 text-right">
                      <Button size="raw" variant="ghost"
                        onClick={() => openDetail(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        {t('view')}
                      </Button>
                    </td>
                  </InViewRow>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && result && result.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button size="raw" variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('prev')}
            </Button>
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: result.meta.totalPages })}</span>
            <Button size="raw" variant="ghost"
              onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))}
              disabled={page >= result.meta.totalPages}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('next')}
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={!!detail || detailLoading} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg gap-5">
            {detailLoading && <p className="text-xs text-slate-400 font-semibold py-8 text-center">{t('loading')}</p>}

            {detail && (
              <>
                <DialogHeader>
                  <span className="text-[11px] font-mono font-extrabold text-purple-600 dark:text-purple-400">
                    {detail.bookingNumber}
                  </span>
                  <DialogTitle>{detail.serviceTitle}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p><span className="font-bold text-slate-400">{t('colClient')}:</span> {detail.clientName}</p>
                  <p><span className="font-bold text-slate-400">{t('colMaster')}:</span> {detail.masterDisplayName}</p>
                  <p><span className="font-bold text-slate-400">{t('colStatus')}:</span> {te(`bookingStatus.${detail.status}`)}</p>
                  <p><span className="font-bold text-slate-400">{t('colPrice')}:</span> {money(detail.price)}</p>
                  <p className="col-span-2">
                    <span className="font-bold text-slate-400">{t('scheduledLabel')}:</span> {fmt.dateTime(detail.scheduledAt)}
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
                          <span className="text-slate-400">{fmt.dateTime(h.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cancellable(detail.status) && (
                  <Button
                    variant="brand"
                    onClick={() => handleForceCancel(detail.id)}
                    disabled={cancelling}
                    className="w-full h-auto py-3 rounded-2xl bg-red-600 hover:bg-red-700 shadow-red-600/25 text-xs shadow"
                  >
                    {cancelling ? '...' : t('forceCancel')}
                  </Button>
                )}
              </>
            )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
